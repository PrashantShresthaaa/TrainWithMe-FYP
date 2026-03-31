const asyncHandler = require('express-async-handler');
const TrainerProfile = require('../models/trainerModel');
const User = require('../models/userModel');
const createNotification = require('../utils/createNotification');

const ensureTrainer = (req, res) => {
  if (req.user?.role !== 'trainer') {
    res.status(403);
    throw new Error('Trainer access only');
  }
};

const getOrCreateTrainerProfile = async (userId) => {
  let profile = await TrainerProfile.findOne({ user: userId });
  if (!profile) {
    profile = await TrainerProfile.create({ user: userId });
  }
  return profile;
};

// @desc    Create or update trainer profile
// @route   POST /api/trainers
// @access  Private (Trainer only)
const updateTrainerProfile = asyncHandler(async (req, res) => {
  ensureTrainer(req, res);

  const {
    bio,
    specialty,
    price,
    experience,
    profileImage,
    location,
    languages,
    certifications,
    timeSlots,
  } = req.body;

  const profile = await getOrCreateTrainerProfile(req.user.id);

  if (bio !== undefined) profile.bio = bio;
  if (specialty !== undefined) profile.specialty = specialty;
  if (price !== undefined) profile.price = price;
  if (experience !== undefined) profile.experience = experience;
  if (profileImage !== undefined) profile.profileImage = profileImage;
  if (location !== undefined) profile.location = location;
  if (languages !== undefined) profile.languages = languages;
  if (certifications !== undefined) profile.certifications = certifications;
  if (timeSlots !== undefined) profile.timeSlots = timeSlots;

  const updated = await profile.save();
  const populated = await updated.populate('user', 'name email role');
  res.status(200).json(populated);
});

// @desc    Submit or resubmit trainer verification documents
// @route   POST /api/trainers/verification
// @access  Private (Trainer only)
const submitTrainerVerification = asyncHandler(async (req, res) => {
  ensureTrainer(req, res);

  const profile = await getOrCreateTrainerProfile(req.user.id);
  const files = req.files || {};

  const certificateImage =
    files.certificate?.[0]?.path || profile.verificationDocuments?.certificateImage || '';
  const citizenshipFrontImage =
    files.citizenshipFront?.[0]?.path || profile.verificationDocuments?.citizenshipFrontImage || '';
  const citizenshipBackImage =
    files.citizenshipBack?.[0]?.path || profile.verificationDocuments?.citizenshipBackImage || '';

  if (!certificateImage || !citizenshipFrontImage) {
    res.status(400);
    throw new Error('Certificate and citizenship front image are required');
  }

  profile.verificationDocuments = {
    certificateImage,
    citizenshipFrontImage,
    citizenshipBackImage,
  };
  profile.verificationStatus = 'pending';
  profile.isVerified = false;
  profile.verificationSubmittedAt = new Date();
  profile.verificationReviewedAt = null;
  profile.verificationNote = '';

  const saved = await profile.save();

  const admins = await User.find({ role: 'admin' }).select('_id');
  await Promise.all(
    admins.map((admin) =>
      createNotification({
        io: req.app.get('io'),
        user: admin._id,
        title: 'New trainer verification submission',
        message: `${req.user.name} submitted trainer verification documents for review.`,
        type: 'system',
        targetTab: 'trainers',
        metadata: { trainerProfileId: saved._id, trainerUserId: req.user._id },
      })
    )
  );

  const populated = await saved.populate('user', 'name email role');
  res.status(200).json(populated);
});

// @desc    Add or update a package on trainer profile
// @route   POST /api/trainers/packages
// @access  Private (Trainer only)
const upsertPackage = asyncHandler(async (req, res) => {
  ensureTrainer(req, res);

  const { packageId, name, sessions, price, discount, description, isActive } = req.body;

  const profile = await getOrCreateTrainerProfile(req.user.id);

  if (packageId) {
    const pkg = profile.packages.id(packageId);
    if (!pkg) {
      res.status(404);
      throw new Error('Package not found');
    }
    if (name !== undefined) pkg.name = name;
    if (sessions !== undefined) pkg.sessions = sessions;
    if (price !== undefined) pkg.price = price;
    if (discount !== undefined) pkg.discount = discount;
    if (description !== undefined) pkg.description = description;
    if (isActive !== undefined) pkg.isActive = isActive;
  } else {
    profile.packages.push({
      name,
      sessions,
      price,
      discount: discount || 0,
      description: description || '',
      isActive: true,
    });
  }

  await profile.save();
  res.status(200).json(profile.packages);
});

// @desc    Delete a package
// @route   DELETE /api/trainers/packages/:packageId
// @access  Private (Trainer only)
const deletePackage = asyncHandler(async (req, res) => {
  ensureTrainer(req, res);

  const profile = await getOrCreateTrainerProfile(req.user.id);
  profile.packages = profile.packages.filter(
    (pkg) => pkg._id.toString() !== req.params.packageId
  );

  await profile.save();
  res.status(200).json({ message: 'Package deleted', packages: profile.packages });
});

// @desc    Get all approved trainers for public listing
// @route   GET /api/trainers
// @access  Public
const getTrainers = asyncHandler(async (req, res) => {
  const trainers = await TrainerProfile.find({
    isVerified: true,
    verificationStatus: 'approved',
  })
    .select(
      'user bio specialty price experience profileImage location languages certifications timeSlots packages isVerified rating numReviews'
    )
    .populate('user', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json(trainers);
});

// @desc    Get logged-in trainer profile including verification data
// @route   GET /api/trainers/me
// @access  Private (Trainer only)
const getMyProfile = asyncHandler(async (req, res) => {
  ensureTrainer(req, res);

  const profile = await getOrCreateTrainerProfile(req.user.id);
  const populated = await profile.populate('user', 'name email role');
  res.status(200).json(populated);
});

module.exports = {
  updateTrainerProfile,
  submitTrainerVerification,
  upsertPackage,
  deletePackage,
  getTrainers,
  getMyProfile,
};
