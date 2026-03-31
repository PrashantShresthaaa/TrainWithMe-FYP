const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const TrainerProfile = require('../models/trainerModel');
const Booking = require('../models/bookingModel');
const createNotification = require('../utils/createNotification');

const getAdminOverview = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalClients = await User.countDocuments({ role: 'client' });
  const totalTrainers = await User.countDocuments({ role: 'trainer' });
  const totalAdmins = await User.countDocuments({ role: 'admin' });

  const verifiedTrainers = await TrainerProfile.countDocuments({ verificationStatus: 'approved' });
  const pendingVerifications = await TrainerProfile.countDocuments({ verificationStatus: 'pending' });

  const totalBookings = await Booking.countDocuments();
  const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
  const completedBookings = await Booking.countDocuments({ status: 'completed' });
  const paidBookings = await Booking.countDocuments({ paymentStatus: 'paid' });

  const revenue = await Booking.aggregate([
    { $match: { paymentStatus: 'paid' } },
    {
      $group: {
        _id: null,
        grossRevenue: { $sum: '$totalAmount' },
        platformRevenue: { $sum: '$platformFee' },
        trainerRevenue: { $sum: '$trainerEarning' },
      },
    },
  ]);

  const recentBookings = await Booking.find({})
    .populate('client', 'name email')
    .populate('trainer', 'name email')
    .sort({ createdAt: -1 })
    .limit(8);

  res.status(200).json({
    stats: {
      totalUsers,
      totalClients,
      totalTrainers,
      totalAdmins,
      verifiedTrainers,
      pendingVerifications,
      totalBookings,
      confirmedBookings,
      completedBookings,
      paidBookings,
      grossRevenue: revenue[0]?.grossRevenue || 0,
      platformRevenue: revenue[0]?.platformRevenue || 0,
      trainerRevenue: revenue[0]?.trainerRevenue || 0,
    },
    recentBookings,
  });
});

const getAdminTrainers = asyncHandler(async (req, res) => {
  const trainers = await TrainerProfile.find({})
    .populate('user', 'name email role')
    .sort({ verificationSubmittedAt: -1, createdAt: -1 });

  res.status(200).json(trainers);
});

const updateTrainerVerification = asyncHandler(async (req, res) => {
  const { verificationStatus, reviewNote = '', isVerified } = req.body;

  let nextStatus = verificationStatus;
  if (!nextStatus && typeof isVerified === 'boolean') {
    nextStatus = isVerified ? 'approved' : 'rejected';
  }

  if (!['approved', 'rejected', 'resubmit_required'].includes(nextStatus)) {
    res.status(400);
    throw new Error('verificationStatus must be approved, rejected, or resubmit_required');
  }

  const trainer = await TrainerProfile.findById(req.params.id).populate('user', 'name email');

  if (!trainer) {
    res.status(404);
    throw new Error('Trainer profile not found');
  }

  trainer.verificationStatus = nextStatus;
  trainer.isVerified = nextStatus === 'approved';
  trainer.verificationReviewedAt = new Date();
  trainer.verificationNote = reviewNote;

  const updated = await trainer.save();

  const notificationMap = {
    approved: {
      title: 'Trainer profile verified',
      message:
        'Your trainer profile has been approved. You are now visible to clients and can start receiving bookings.',
    },
    rejected: {
      title: 'Trainer verification rejected',
      message:
        reviewNote ||
        'Your trainer verification was rejected. Please review your documents and submit again if needed.',
    },
    resubmit_required: {
      title: 'Trainer verification needs resubmission',
      message:
        reviewNote ||
        'Your trainer verification needs updated documents. Please upload clearer or corrected files and resubmit.',
    },
  };

  await createNotification({
    io: req.app.get('io'),
    user: trainer.user._id,
    title: notificationMap[nextStatus].title,
    message: notificationMap[nextStatus].message,
    type: 'system',
    targetTab: 'overview',
    metadata: { trainerProfileId: trainer._id, verificationStatus: nextStatus },
  });

  res.status(200).json(updated);
});

const getAdminUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password').sort({ createdAt: -1 });
  res.status(200).json(users);
});

const getAdminBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({})
    .populate('client', 'name email')
    .populate('trainer', 'name email')
    .sort({ createdAt: -1 })
    .limit(100);

  res.status(200).json(bookings);
});

module.exports = {
  getAdminOverview,
  getAdminTrainers,
  updateTrainerVerification,
  getAdminUsers,
  getAdminBookings,
};
