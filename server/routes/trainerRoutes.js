const express = require('express');
const router = express.Router();
const {
  updateTrainerProfile,
  upsertPackage,
  deletePackage,
  getTrainers,
  getMyProfile,
} = require('../controllers/trainerController');
const { protect } = require('../middleware/authMiddleware');

// Public
router.get('/', getTrainers);

// Private
router.get('/me', protect, getMyProfile);
router.post('/', protect, updateTrainerProfile);

// Packages
router.post('/packages', protect, upsertPackage);
router.delete('/packages/:packageId', protect, deletePackage);

module.exports = router;