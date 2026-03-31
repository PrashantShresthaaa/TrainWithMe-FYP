const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const router = express.Router();
const {
  updateTrainerProfile,
  submitTrainerVerification,
  upsertPackage,
  deletePackage,
  getTrainers,
  getMyProfile,
} = require('../controllers/trainerController');
const { protect } = require('../middleware/authMiddleware');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const verificationStorage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: 'trainwithme/trainer-verification',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  }),
});

const verificationUpload = multer({
  storage: verificationStorage,
  limits: { fileSize: 15 * 1024 * 1024 },
});

router.get('/', getTrainers);

router.get('/me', protect, getMyProfile);
router.post('/', protect, updateTrainerProfile);
router.post('/verification', protect, (req, res, next) => {
  verificationUpload.fields([
    { name: 'certificate', maxCount: 1 },
    { name: 'citizenshipFront', maxCount: 1 },
    { name: 'citizenshipBack', maxCount: 1 },
  ])(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        res.status(400);
        return next(new Error(err.code === 'LIMIT_FILE_SIZE'
          ? 'One of the uploaded files is too large. Please upload an image smaller than 15 MB.'
          : err.message));
      }
      return next(err);
    }
    next();
  });
}, submitTrainerVerification);


router.post('/packages', protect, upsertPackage);
router.delete('/packages/:packageId', protect, deletePackage);

module.exports = router;
