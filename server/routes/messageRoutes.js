const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const { protect } = require('../middleware/authMiddleware');

const {
  sendMessage,
  uploadFile,
  uploadVoice,
  saveCallLog,
  getMyConversations,
  getConversation,
  acceptRequest,
  declineRequest,
} = require('../controllers/messageController');

// ── Cloudinary storage for images and files ──
const fileStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder:          'trainwithme/messages',
    resource_type:   file.mimetype.startsWith('image/') ? 'image' : 'raw',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx'],
  }),
});

const fileUpload = multer({
  storage: fileStorage,
  limits:  { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// ── Memory storage for voice (we stream directly to Cloudinary in controller) ──
const voiceUpload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 },
});

// ── Routes ──
router.post('/',                    protect, sendMessage);
router.post('/upload',              protect, fileUpload.single('file'),  uploadFile);
router.post('/voice',               protect, voiceUpload.single('voice'), uploadVoice);
router.post('/calllog',             protect, saveCallLog);
router.get('/conversations',        protect, getMyConversations);
router.get('/conversation/:userId', protect, getConversation);
router.patch('/accept/:senderId',   protect, acceptRequest);
router.delete('/decline/:senderId', protect, declineRequest);

module.exports = router;