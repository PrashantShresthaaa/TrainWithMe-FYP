const express = require('express');
const router = express.Router();
const {
  getAdminOverview,
  getAdminTrainers,
  updateTrainerVerification,
  getAdminUsers,
  getAdminBookings,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect, adminOnly);

router.get('/overview', getAdminOverview);
router.get('/trainers', getAdminTrainers);
router.patch('/trainers/:id/verify', updateTrainerVerification);
router.get('/users', getAdminUsers);
router.get('/bookings', getAdminBookings);

module.exports = router;
