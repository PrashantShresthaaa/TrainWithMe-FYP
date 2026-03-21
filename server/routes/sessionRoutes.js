const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getOrCreateSession,
  joinSession,
  endSession,
  getMySessions,
} = require('../controllers/sessionController');

router.get('/my',                        protect, getMySessions);
router.get('/booking/:bookingId',        protect, getOrCreateSession);
router.patch('/:roomId/join',            protect, joinSession);
router.patch('/:roomId/end',             protect, endSession);

module.exports = router;