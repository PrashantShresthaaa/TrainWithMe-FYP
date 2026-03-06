const asyncHandler = require('express-async-handler');
const Booking = require('../models/bookingModel');
const TrainerProfile = require('../models/trainerModel');

// @desc    Create a new booking request
// @route   POST /api/bookings
// @access  Private (Client only)
const createBooking = asyncHandler(async (req, res) => {
  const { trainerId, sessionDate, sessionTime, sessionType, price, notes } = req.body;

  if (!trainerId || !sessionDate || !sessionTime || !sessionType || !price) {
    res.status(400);
    throw new Error('Please provide all required booking details');
  }

  // Find trainer profile by USER id
  const trainerProfile = await TrainerProfile.findOne({ user: trainerId }).populate('user', 'name email');

  if (!trainerProfile) {
    res.status(404);
    throw new Error('Trainer not found');
  }

  // Prevent trainer from booking themselves
  if (req.user._id.toString() === trainerId.toString()) {
    res.status(400);
    throw new Error('Trainers cannot book themselves');
  }

  // Always store trainer's USER id in booking
  const booking = await Booking.create({
    client: req.user._id,
    trainer: trainerProfile.user._id, // <-- always use user._id, never profile._id
    sessionDate,
    sessionTime,
    sessionType,
    price,
    notes: notes || '',
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

// @desc    Update booking status (trainer confirms/rejects, client cancels)
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
  const clientIdInBooking  = booking.client.toString();

  let isTrainer = currentUserId === trainerIdInBooking;
  let isClient  = currentUserId === clientIdInBooking;

  // Fallback: if no direct match, check TrainerProfile ownership
  // This handles any old bookings that may have stored profile._id instead of user._id
  if (!isTrainer) {
    const trainerProfile = await TrainerProfile.findOne({ user: currentUserId });
    if (trainerProfile && trainerProfile._id.toString() === trainerIdInBooking) {
      isTrainer = true;
    }
  }

  // Debug log — helps catch ID mismatches instantly
  console.log('--- updateBookingStatus DEBUG ---');
  console.log('currentUserId:     ', currentUserId);
  console.log('trainerIdInBooking:', trainerIdInBooking);
  console.log('clientIdInBooking: ', clientIdInBooking);
  console.log('isTrainer:', isTrainer, '| isClient:', isClient);

  if (!isTrainer && !isClient) {
    res.status(403);
    throw new Error('Not authorized to update this booking');
  }

  if (isTrainer && !isClient && !['confirmed', 'rejected', 'completed'].includes(status)) {
    res.status(403);
    throw new Error('Trainers can only set status to: confirmed, rejected, completed');
  }

  if (isClient && !isTrainer && status !== 'cancelled') {
    res.status(403);
    throw new Error('Clients can only cancel a booking');
  }

  booking.status = status;
  const updatedBooking = await booking.save();
  res.status(200).json(updatedBooking);
});

module.exports = { createBooking, getMyBookings, updateBookingStatus };