const asyncHandler = require('express-async-handler');
const TrainerProfile = require('../models/trainerModel');
const User = require('../models/userModel');

// @desc    Create or Update Trainer Profile (all fields)
// @route   POST /api/trainers
// @access  Private (Trainer Only)
const updateTrainerProfile = asyncHandler(async (req, res) => {
  const {
    bio, specialty, price, experience,
    profileImage, location, languages,
    certifications, timeSlots,
  } = req.body;

  let profile = await TrainerProfile.findOne({ user: req.user.id });

  if (profile) {
    if (bio          !== undefined) profile.bio          = bio;
    if (specialty    !== undefined) profile.specialty    = specialty;
    if (price        !== undefined) profile.price        = price;
    if (experience   !== undefined) profile.experience   = experience;
    if (profileImage !== undefined) profile.profileImage = profileImage;
    if (location     !== undefined) profile.location     = location;
    if (languages    !== undefined) profile.languages    = languages;
    if (certifications !== undefined) profile.certifications = certifications;
    if (timeSlots    !== undefined) profile.timeSlots    = timeSlots;

    const updated = await profile.save();
    res.json(updated);
  } else {
    const newProfile = await TrainerProfile.create({
      user: req.user.id,
      bio:            bio            || '',
      specialty:      specialty      || 'Gym',
      price:          price          || 0,
      experience:     experience     || 0,
      profileImage:   profileImage   || '',
      location:       location       || 'Kathmandu, Nepal',
      languages:      languages      || ['Nepali'],
      certifications: certifications || [],
      timeSlots:      timeSlots      || [],
    });
    res.status(201).json(newProfile);
  }
});

// @desc    Add or update a package on trainer profile
// @route   POST /api/trainers/packages
// @access  Private (Trainer Only)
const upsertPackage = asyncHandler(async (req, res) => {
  const { packageId, name, sessions, price, discount, description, isActive } = req.body;

  const profile = await TrainerProfile.findOne({ user: req.user.id });
  if (!profile) {
    res.status(404);
    throw new Error('Trainer profile not found. Please set up your profile first.');
  }

  if (packageId) {
    // Update existing package
    const pkg = profile.packages.id(packageId);
    if (!pkg) { res.status(404); throw new Error('Package not found'); }
    if (name        !== undefined) pkg.name        = name;
    if (sessions    !== undefined) pkg.sessions    = sessions;
    if (price       !== undefined) pkg.price       = price;
    if (discount    !== undefined) pkg.discount    = discount;
    if (description !== undefined) pkg.description = description;
    if (isActive    !== undefined) pkg.isActive    = isActive;
  } else {
    // Add new package
    profile.packages.push({ name, sessions, price, discount: discount || 0, description: description || '', isActive: true });
  }

  await profile.save();
  res.json(profile.packages);
});

// @desc    Delete a package
// @route   DELETE /api/trainers/packages/:packageId
// @access  Private (Trainer Only)
const deletePackage = asyncHandler(async (req, res) => {
  const profile = await TrainerProfile.findOne({ user: req.user.id });
  if (!profile) { res.status(404); throw new Error('Profile not found'); }

  profile.packages = profile.packages.filter(
    p => p._id.toString() !== req.params.packageId
  );
  await profile.save();
  res.json({ message: 'Package deleted', packages: profile.packages });
});

// @desc    Get all trainers
// @route   GET /api/trainers
// @access  Public
const getTrainers = asyncHandler(async (req, res) => {
  const trainers = await TrainerProfile.find({}).populate('user', 'name email');
  res.json(trainers);
});

// @desc    Get logged-in trainer's own profile
// @route   GET /api/trainers/me
// @access  Private
const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await TrainerProfile.findOne({ user: req.user.id }).populate('user', 'name email');
  if (!profile) { res.status(404); throw new Error('Profile not found'); }
  res.json(profile);
});

module.exports = { updateTrainerProfile, upsertPackage, deletePackage, getTrainers, getMyProfile };