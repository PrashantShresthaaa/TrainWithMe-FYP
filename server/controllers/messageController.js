const asyncHandler = require('express-async-handler');
const cloudinary   = require('cloudinary').v2;
const Message      = require('../models/messageModel');
const Booking      = require('../models/bookingModel');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Helper: booking exists between two users ──
const hasBookingTogether = async (userA, userB) => {
  const b = await Booking.findOne({
    $or: [
      { client: userA, trainer: userB },
      { client: userB, trainer: userA },
    ],
    status: { $in: ['pending', 'confirmed', 'completed'] },
  });
  return !!b;
};

// ── Helper: prior accepted request ──
const hasPriorAccepted = async (senderId, receiverId) => {
  const m = await Message.findOne({ sender: senderId, receiver: receiverId, isRequest: true, requestAccepted: true });
  return !!m;
};

// ─────────────────────────────────────────────────────────
// POST /api/messages  — send text message
// ─────────────────────────────────────────────────────────
const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, content } = req.body;
  const senderId = req.user._id;

  if (!receiverId || !content?.trim()) { res.status(400); throw new Error('receiverId and content required'); }

  const hasBooking  = await hasBookingTogether(senderId, receiverId);
  const hasAccepted = await hasPriorAccepted(senderId, receiverId);
  const isRequest   = !hasBooking && !hasAccepted;

  const message = await Message.create({
    sender: senderId, receiver: receiverId, content: content.trim(),
    isRequest, requestAccepted: !isRequest,
  });

  const populated = await Message.findById(message._id).populate('sender', 'name email').populate('receiver', 'name email');

  const io = req.app.get('io');
  io.to(senderId.toString()).emit('new_message',   populated);
  io.to(receiverId.toString()).emit('new_message', populated);

  res.status(201).json(populated);
});

// ─────────────────────────────────────────────────────────
// POST /api/messages/upload  — send file / image
// ─────────────────────────────────────────────────────────
const uploadFile = asyncHandler(async (req, res) => {
  const { receiverId } = req.body;
  const senderId = req.user._id;

  if (!req.file) { res.status(400); throw new Error('No file uploaded'); }

  const isImage  = req.file.mimetype.startsWith('image/');
  const fileType = isImage ? 'image' : req.file.mimetype === 'application/pdf' ? 'pdf' : 'file';

  const hasBooking  = await hasBookingTogether(senderId, receiverId);
  const hasAccepted = await hasPriorAccepted(senderId, receiverId);
  const isRequest   = !hasBooking && !hasAccepted;

  const message = await Message.create({
    sender: senderId, receiver: receiverId, content: '',
    fileUrl: req.file.path, fileType, fileName: req.file.originalname,
    isRequest, requestAccepted: !isRequest,
  });

  const populated = await Message.findById(message._id).populate('sender', 'name email').populate('receiver', 'name email');

  const io = req.app.get('io');
  io.to(senderId.toString()).emit('new_message',   populated);
  io.to(receiverId.toString()).emit('new_message', populated);

  res.status(201).json(populated);
});

// ─────────────────────────────────────────────────────────
// POST /api/messages/voice  — record and send voice message
// ─────────────────────────────────────────────────────────
const uploadVoice = asyncHandler(async (req, res) => {
  const { receiverId, duration } = req.body;
  const senderId = req.user._id;

  if (!req.file) { res.status(400); throw new Error('No voice file'); }

  // Upload audio buffer directly to Cloudinary as raw resource
  const uploadResult = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'raw', folder: 'trainwithme/voice', format: 'webm' },
      (error, result) => { if (error) reject(error); else resolve(result); }
    );
    stream.end(req.file.buffer);
  });

  const hasBooking  = await hasBookingTogether(senderId, receiverId);
  const hasAccepted = await hasPriorAccepted(senderId, receiverId);
  const isRequest   = !hasBooking && !hasAccepted;

  const message = await Message.create({
    sender: senderId, receiver: receiverId, content: '',
    fileUrl:      uploadResult.secure_url,
    fileType:     'voice',
    fileName:     'Voice Message',
    fileDuration: duration ? parseInt(duration) : null,
    isRequest,    requestAccepted: !isRequest,
  });

  const populated = await Message.findById(message._id).populate('sender', 'name email').populate('receiver', 'name email');

  const io = req.app.get('io');
  io.to(senderId.toString()).emit('new_message',   populated);
  io.to(receiverId.toString()).emit('new_message', populated);

  res.status(201).json(populated);
});

// ─────────────────────────────────────────────────────────
// POST /api/messages/calllog  — save call event as chat message
// ─────────────────────────────────────────────────────────
const saveCallLog = asyncHandler(async (req, res) => {
  const { receiverId, callStatus, callDuration } = req.body;
  const senderId = req.user._id;

  const labels = {
    initiated: '📞 Call started',
    accepted:  '✅ Call connected',
    declined:  '❌ Call declined',
    missed:    '📵 Missed call',
  };

  let content = labels[callStatus] || '📞 Call';
  if (callDuration) {
    const m = Math.floor(callDuration / 60);
    const s = String(callDuration % 60).padStart(2, '0');
    content += ` · ${m}:${s}`;
  }

  const message = await Message.create({
    sender: senderId, receiver: receiverId,
    content, isCallLog: true,
    callStatus:   callStatus  || null,
    callDuration: callDuration || null,
    isRequest: false, requestAccepted: true,
  });

  const populated = await Message.findById(message._id).populate('sender', 'name email').populate('receiver', 'name email');

  const io = req.app.get('io');
  io.to(senderId.toString()).emit('new_message',   populated);
  io.to(receiverId.toString()).emit('new_message', populated);

  res.status(201).json(populated);
});

// ─────────────────────────────────────────────────────────
// GET /api/messages/conversations  — list all conversations
// ─────────────────────────────────────────────────────────
const getMyConversations = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const messages = await Message.find({ $or: [{ sender: userId }, { receiver: userId }] })
    .populate('sender',   'name email role')
    .populate('receiver', 'name email role')
    .sort({ createdAt: -1 });

  const convMap = {};

  for (const msg of messages) {
    const other   = msg.sender._id.toString() === userId.toString() ? msg.receiver : msg.sender;
    const otherId = other._id.toString();

    if (!convMap[otherId]) {
      const isRequest =
        msg.isRequest && !msg.requestAccepted &&
        msg.receiver._id.toString() === userId.toString();
      convMap[otherId] = { user: other, lastMessage: msg, unread: 0, isRequest };
    }

    if (msg.receiver._id.toString() === userId.toString() && !msg.read && !msg.isCallLog) {
      convMap[otherId].unread = (convMap[otherId].unread || 0) + 1;
    }
  }

  res.json(Object.values(convMap));
});

// ─────────────────────────────────────────────────────────
// GET /api/messages/conversation/:userId  — full chat history
// ─────────────────────────────────────────────────────────
const getConversation = asyncHandler(async (req, res) => {
  const myId    = req.user._id;
  const otherId = req.params.userId;

  const hasBooking  = await hasBookingTogether(myId, otherId);
  const hasAccepted = await hasPriorAccepted(otherId, myId) || await hasPriorAccepted(myId, otherId);
  const locked      = !hasBooking && !hasAccepted;

  let messages = await Message.find({
    $or: [{ sender: myId, receiver: otherId }, { sender: otherId, receiver: myId }],
  }).populate('sender', 'name email').populate('receiver', 'name email').sort({ createdAt: 1 });

  if (locked && messages.length > 0) {
    const first = messages.find(m => m.isRequest) || messages[0];
    messages = [first];
  }

  await Message.updateMany({ sender: otherId, receiver: myId, read: false }, { read: true });

  res.json({ messages, locked });
});

// ─────────────────────────────────────────────────────────
// PATCH /api/messages/accept/:senderId
// ─────────────────────────────────────────────────────────
const acceptRequest = asyncHandler(async (req, res) => {
  const receiverId = req.user._id;
  const senderId   = req.params.senderId;
  await Message.updateMany({ sender: senderId, receiver: receiverId, isRequest: true }, { requestAccepted: true });
  req.app.get('io').to(senderId.toString()).emit('request_accepted', { by: receiverId });
  res.json({ success: true });
});

// ─────────────────────────────────────────────────────────
// DELETE /api/messages/decline/:senderId
// ─────────────────────────────────────────────────────────
const declineRequest = asyncHandler(async (req, res) => {
  const receiverId = req.user._id;
  const senderId   = req.params.senderId;
  await Message.deleteMany({ sender: senderId, receiver: receiverId });
  res.json({ success: true });
});

module.exports = {
  sendMessage,
  uploadFile,
  uploadVoice,
  saveCallLog,
  getMyConversations,
  getConversation,
  acceptRequest,
  declineRequest,
};