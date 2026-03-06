const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  sendMessage,
  uploadFile,
  getConversation,
  getMyConversations,
  acceptRequest,
  declineRequest,
} = require('../controllers/messageController');

// Cloudinary + Multer setup
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isImage = file.mimetype.startsWith('image/');
    return {
      folder:        'trainwithme/messages',
      resource_type: isImage ? 'image' : 'raw',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx'],
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

// Routes
router.post('/',                        protect, sendMessage);
router.post('/upload',                  protect, upload.single('file'), uploadFile);
router.get('/conversations',            protect, getMyConversations);
router.get('/conversation/:userId',     protect, getConversation);
router.patch('/accept/:senderId',       protect, acceptRequest);
router.delete('/decline/:senderId',     protect, declineRequest);

module.exports = router;