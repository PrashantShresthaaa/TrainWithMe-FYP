const asyncHandler = require('express-async-handler');
const Message = require('../models/messageModel');
const Booking = require('../models/bookingModel');
const User = require('../models/userModel');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Helper: check if two users have any booking together ──
const hasBookingTogether = async (userAId, userBId) => {
  const booking = await Booking.findOne({
    $or: [
      { client: userAId, trainer: userBId },
      { client: userBId, trainer: userAId },
    ],
    status: { $in: ['pending', 'confirmed', 'completed'] },
  });
  return !!booking;
};

// ── Helper: check if a prior accepted request exists ──
const hasPriorAccepted = async (userAId, userBId) => {
  const msg = await Message.findOne({
    $or: [
      { sender: userAId, receiver: userBId, requestAccepted: true },
      { sender: userBId, receiver: userAId, requestAccepted: true },
    ],
  });
  return !!msg;
};

// @desc  Send a text message
// @route POST /api/messages
// @access Private
const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, content } = req.body;
  const senderId = req.user._id;

  if (!receiverId || !content?.trim()) {
    res.status(400);
    throw new Error('receiverId and content are required');
  }

  if (senderId.toString() === receiverId.toString()) {
    res.status(400);
    throw new Error('Cannot message yourself');
  }

  const receiver = await User.findById(receiverId);
  if (!receiver) {
    res.status(404);
    throw new Error('Receiver not found');
  }

  const booked   = await hasBookingTogether(senderId, receiverId);
  const accepted = await hasPriorAccepted(senderId, receiverId);
  const isRequest = !booked && !accepted;

  const message = await Message.create({
    sender:          senderId,
    receiver:        receiverId,
    content:         content.trim(),
    isRequest,
    requestAccepted: booked || accepted,
  });

  const populated = await message.populate('sender receiver', 'name email role');

  // Emit via Socket.io (attached to req.app)
  const io = req.app.get('io');
  if (io) {
    io.to(receiverId.toString()).emit('new_message', populated);
    io.to(senderId.toString()).emit('new_message', populated);
  }

  res.status(201).json(populated);
});

// @desc  Upload a file/image message (via Cloudinary)
// @route POST /api/messages/upload
// @access Private
const uploadFile = asyncHandler(async (req, res) => {
  const { receiverId } = req.body;
  const senderId = req.user._id;

  if (!receiverId) {
    res.status(400);
    throw new Error('receiverId is required');
  }

  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  const receiver = await User.findById(receiverId);
  if (!receiver) {
    res.status(404);
    throw new Error('Receiver not found');
  }

  // Determine file type
  const mime = req.file.mimetype;
  let fileType = 'file';
  if (mime.startsWith('image/')) fileType = 'image';
  else if (mime === 'application/pdf') fileType = 'pdf';

  const booked   = await hasBookingTogether(senderId, receiverId);
  const accepted = await hasPriorAccepted(senderId, receiverId);
  const isRequest = !booked && !accepted;

  const message = await Message.create({
    sender:          senderId,
    receiver:        receiverId,
    content:         '',
    fileUrl:         req.file.path,       // Cloudinary URL via multer-storage-cloudinary
    fileType,
    fileName:        req.file.originalname,
    isRequest,
    requestAccepted: booked || accepted,
  });

  const populated = await message.populate('sender receiver', 'name email role');

  const io = req.app.get('io');
  if (io) {
    io.to(receiverId.toString()).emit('new_message', populated);
    io.to(senderId.toString()).emit('new_message', populated);
  }

  res.status(201).json(populated);
});

// @desc  Get full conversation between logged-in user and another user
// @route GET /api/messages/conversation/:userId
// @access Private
const getConversation = asyncHandler(async (req, res) => {
  const myId    = req.user._id;
  const otherId = req.params.userId;

  const booked   = await hasBookingTogether(myId, otherId);
  const accepted = await hasPriorAccepted(myId, otherId);

  if (!booked && !accepted) {
    // Only return first message as a request preview
    const firstMsg = await Message.findOne({
      $or: [
        { sender: myId,    receiver: otherId },
        { sender: otherId, receiver: myId },
      ],
    })
      .populate('sender receiver', 'name email role')
      .sort({ createdAt: 1 });

    return res.json({ locked: true, messages: firstMsg ? [firstMsg] : [] });
  }

  const messages = await Message.find({
    $or: [
      { sender: myId,    receiver: otherId },
      { sender: otherId, receiver: myId },
    ],
  })
    .populate('sender receiver', 'name email role')
    .sort({ createdAt: 1 });

  // Mark as read
  await Message.updateMany(
    { sender: otherId, receiver: myId, read: false },
    { read: true }
  );

  res.json({ locked: false, messages });
});

// @desc  Get all conversations (list) for logged-in user
// @route GET /api/messages/conversations
// @access Private
const getMyConversations = asyncHandler(async (req, res) => {
  const myId = req.user._id;

  const allMessages = await Message.find({
    $or: [{ sender: myId }, { receiver: myId }],
  })
    .populate('sender receiver', 'name email role')
    .sort({ createdAt: -1 });

  const convMap = new Map();
  for (const msg of allMessages) {
    const other   = msg.sender._id.toString() === myId.toString() ? msg.receiver : msg.sender;
    const otherId = other._id.toString();
    if (!convMap.has(otherId)) {
      const unread = await Message.countDocuments({
        sender:   other._id,
        receiver: myId,
        read:     false,
      });
      convMap.set(otherId, {
        user:        other,
        lastMessage: msg,
        unread,
        isRequest:
          msg.isRequest &&
          !msg.requestAccepted &&
          msg.receiver._id.toString() === myId.toString(),
      });
    }
  }

  res.json(Array.from(convMap.values()));
});

// @desc  Accept a message request
// @route PATCH /api/messages/accept/:senderId
// @access Private
const acceptRequest = asyncHandler(async (req, res) => {
  const myId     = req.user._id;
  const senderId = req.params.senderId;

  await Message.updateMany(
    { sender: senderId, receiver: myId, isRequest: true },
    { requestAccepted: true }
  );

  // Notify sender their request was accepted
  const io = req.app.get('io');
  if (io) {
    io.to(senderId.toString()).emit('request_accepted', { by: myId });
  }

  res.json({ message: 'Request accepted' });
});

// @desc  Decline a message request
// @route DELETE /api/messages/decline/:senderId
// @access Private
const declineRequest = asyncHandler(async (req, res) => {
  const myId     = req.user._id;
  const senderId = req.params.senderId;

  await Message.deleteMany({ sender: senderId, receiver: myId });

  res.json({ message: 'Request declined' });
});

module.exports = {
  sendMessage,
  uploadFile,
  getConversation,
  getMyConversations,
  acceptRequest,
  declineRequest,
};