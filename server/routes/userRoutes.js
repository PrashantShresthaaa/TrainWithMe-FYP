const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe } = require('../controllers/userController');

// Import the Middleware
const { protect } = require('../middleware/authMiddleware');

// Public Routes
router.post('/', registerUser);
router.post('/login', loginUser);

// Private Route (Protected)
// We put 'protect' as the second argument. It runs BEFORE getMe.
router.get('/me', protect, getMe);

module.exports = router;