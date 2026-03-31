const express = require('express');
const router = express.Router();
const {
  initiateKhaltiPayment,
  verifyKhaltiPayment,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/khalti/initiate', initiateKhaltiPayment);
router.post('/khalti/verify', verifyKhaltiPayment);

module.exports = router;
