const asyncHandler = require('express-async-handler');
const Booking = require('../models/bookingModel');
const TrainerProfile = require('../models/trainerModel');
const User = require('../models/userModel');
const createNotification = require('../utils/createNotification');

const DEFAULT_PLATFORM_FEE_PERCENT = 10;

const calculateSplit = (amount, feePercent = DEFAULT_PLATFORM_FEE_PERCENT) => {
  const totalAmount = Number(amount) || 0;
  const platformFee = Math.round(totalAmount * (feePercent / 100));
  const trainerEarning = totalAmount - platformFee;

  return {
    totalAmount,
    platformFee,
    trainerEarning,
    platformFeePercent: feePercent,
  };
};

// @desc    Create a new booking request
// @route   POST /api/bookings
// @access  Private (Client only)
const createBooking = asyncHandler(async (req, res) => {
  const { trainerId, sessionDate, sessionTime, sessionType, price, notes } = req.body;

  if (!trainerId || !sessionDate || !sessionTime || !sessionType || !price) {
    res.status(400);
    throw new Error('Please provide all required booking details');
  }

  const trainerProfile = await TrainerProfile.findOne({ user: trainerId }).populate('user', 'name email');

  if (!trainerProfile) {
    res.status(404);
    throw new Error('Trainer not found');
  }

  if (!trainerProfile.isVerified || trainerProfile.verificationStatus !== 'approved') {
    res.status(400);
    throw new Error('This trainer is not verified yet and cannot receive bookings');
  }

  if (req.user._id.toString() === trainerId.toString()) {
    res.status(400);
    throw new Error('Trainers cannot book themselves');
  }

  const split = calculateSplit(price);

  const booking = await Booking.create({
    client: req.user._id,
    trainer: trainerProfile.user._id,
    sessionDate,
    sessionTime,
    sessionType,
    price,
    totalAmount: split.totalAmount,
    platformFee: split.platformFee,
    trainerEarning: split.trainerEarning,
    platformFeePercent: split.platformFeePercent,
    paymentStatus: 'unpaid',
    paymentMethod: 'none',
    payoutStatus: 'held',
    notes: notes || '',
  });

  await createNotification({
    io: req.app.get('io'),
    user: trainerProfile.user._id,
    title: 'New booking request',
    message: `${req.user.name} sent a booking request for ${sessionDate} at ${sessionTime}.`,
    type: 'booking',
    targetTab: 'requests',
    metadata: { bookingId: booking._id },
  });

  const populatedBooking = await booking.populate('trainer', 'name email');
  res.status(201).json(populatedBooking);
});

// @desc    Get all bookings for the logged-in user (role-aware)
// @route   GET /api/bookings
// @access  Private
const getMyBookings = asyncHandler(async (req, res) => {
  let bookings;

  if (req.user.role === 'trainer') {
    bookings = await Booking.find({ trainer: req.user._id })
      .populate('client', 'name email')
      .sort({ createdAt: -1 });
  } else {
    bookings = await Booking.find({ client: req.user._id })
      .populate('trainer', 'name email')
      .sort({ createdAt: -1 });
  }

  res.status(200).json(bookings);
});

// @desc    Update booking status
// @route   PATCH /api/bookings/:id/status
// @access  Private
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const currentUserId = req.user._id.toString();

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  const trainerIdInBooking = booking.trainer.toString();
  const clientIdInBooking = booking.client.toString();

  let isTrainer = currentUserId === trainerIdInBooking;
  let isClient = currentUserId === clientIdInBooking;

  if (!isTrainer) {
    const trainerProfile = await TrainerProfile.findOne({ user: currentUserId });
    if (trainerProfile && trainerProfile._id.toString() === trainerIdInBooking) {
      isTrainer = true;
    }
  }

  if (!isTrainer && !isClient) {
    res.status(403);
    throw new Error('Not authorized to update this booking');
  }

  const trainerUser = await User.findById(booking.trainer).select('name');
  const clientUser = await User.findById(booking.client).select('name');

  if (isTrainer && !isClient) {
    if (!['accepted_awaiting_payment', 'rejected', 'completed'].includes(status)) {
      res.status(403);
      throw new Error('Trainers can only set status to: accepted_awaiting_payment, rejected, completed');
    }

    if (status === 'accepted_awaiting_payment') {
      if (booking.status !== 'pending') {
        res.status(400);
        throw new Error('Only pending bookings can be accepted for payment');
      }

      booking.status = 'accepted_awaiting_payment';
      booking.paymentStatus = 'pending';
      booking.paymentExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await createNotification({
        io: req.app.get('io'),
        user: booking.client,
        title: 'Booking accepted',
        message: `${trainerUser?.name || 'Your trainer'} accepted your booking. Complete the payment to confirm it.`,
        type: 'booking',
        targetTab: 'mytrainers',
        metadata: { bookingId: booking._id },
      });
    }

    if (status === 'rejected') {
      if (booking.paymentStatus === 'paid') {
        res.status(400);
        throw new Error('Paid bookings cannot be rejected');
      }

      booking.status = 'rejected';
      booking.paymentStatus = booking.paymentStatus === 'paid' ? 'paid' : 'failed';
      booking.paymentExpiresAt = null;

      await createNotification({
        io: req.app.get('io'),
        user: booking.client,
        title: 'Booking rejected',
        message: `${trainerUser?.name || 'Your trainer'} rejected your booking request.`,
        type: 'booking',
        targetTab: 'mytrainers',
        metadata: { bookingId: booking._id },
      });
    }

    if (status === 'completed') {
      if (booking.status !== 'confirmed') {
        res.status(400);
        throw new Error('Only confirmed bookings can be marked completed');
      }

      booking.status = 'completed';

      if (booking.paymentStatus === 'paid') {
        booking.payoutStatus = 'released';
        booking.payoutReleasedAt = new Date();
      }

      await createNotification({
        io: req.app.get('io'),
        user: booking.client,
        title: 'Session completed',
        message: `${trainerUser?.name || 'Your trainer'} marked your session as completed.`,
        type: 'session',
        targetTab: 'mytrainers',
        metadata: { bookingId: booking._id },
      });
    }
  }

  if (isClient && !isTrainer) {
    if (status !== 'cancelled') {
      res.status(403);
      throw new Error('Clients can only cancel a booking');
    }

    if (booking.status === 'completed') {
      res.status(400);
      throw new Error('Completed bookings cannot be cancelled');
    }

    booking.status = 'cancelled';

    if (booking.paymentStatus !== 'paid') {
      booking.paymentStatus = 'failed';
    }

    booking.paymentExpiresAt = null;

    await createNotification({
      io: req.app.get('io'),
      user: booking.trainer,
      title: 'Booking cancelled',
      message: `${clientUser?.name || 'A client'} cancelled a booking.`,
      type: 'booking',
      targetTab: 'requests',
      metadata: { bookingId: booking._id },
    });
  }

  const updatedBooking = await booking.save();
  res.status(200).json(updatedBooking);
});

module.exports = { createBooking, getMyBookings, updateBookingStatus };
