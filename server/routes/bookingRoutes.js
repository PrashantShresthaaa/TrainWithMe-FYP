const express = require('express');
const router = express.Router();
const { createBooking, getMyBookings, updateBookingStatus } = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

// All booking routes are protected - user must be logged in
router.use(protect);

// POST   /api/bookings        → Client sends a booking request
// GET    /api/bookings        → Get all bookings for logged-in user (role-aware)
router.route('/').post(createBooking).get(getMyBookings);

// PATCH  /api/bookings/:id/status  → Trainer confirms/rejects, Client cancels
router.patch('/:id/status', updateBookingStatus);

module.exports = router;