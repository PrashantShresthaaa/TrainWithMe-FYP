const asyncHandler = require('express-async-handler');
const Session = require('../models/sessionModel');
const Booking = require('../models/bookingModel');

// ── Helper: generate a room ID from booking _id ──
const makeRoomId = (bookingId) => `twm-session-${bookingId}`;

// ─────────────────────────────────────────────────────────
// @desc  Get or create a Session record for an online booking
// @route GET /api/sessions/booking/:bookingId
// @access Private
// ─────────────────────────────────────────────────────────
const getOrCreateSession = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const userId = req.user._id.toString();

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  // Only trainer or client of this booking can access
  const isTrainer = booking.trainer.toString() === userId;
  const isClient  = booking.client.toString() === userId;
  if (!isTrainer && !isClient) {
    res.status(403);
    throw new Error('Not authorised');
  }

  // Only valid for Online confirmed bookings
  if (booking.sessionType !== 'Online') {
    res.status(400);
    throw new Error('Session tracking only applies to Online bookings');
  }
  if (booking.status !== 'confirmed') {
    res.status(400);
    throw new Error('Booking must be confirmed before starting a session');
  }

  let session = await Session.findOne({ booking: bookingId });

  if (!session) {
    session = await Session.create({
      booking:   bookingId,
      trainer:   booking.trainer,
      client:    booking.client,
      roomId:    makeRoomId(bookingId),
      sessionStatus: 'scheduled',
    });
  }

  res.json(session);
});

// ─────────────────────────────────────────────────────────
// @desc  Mark trainer or client as joined — called when user enters call room
// @route PATCH /api/sessions/:roomId/join
// @access Private
// ─────────────────────────────────────────────────────────
const joinSession = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id.toString();

  const session = await Session.findOne({ roomId });
  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  const isTrainer = session.trainer.toString() === userId;
  const isClient  = session.client.toString() === userId;
  if (!isTrainer && !isClient) {
    res.status(403);
    throw new Error('Not authorised');
  }

  const now = new Date();

  if (isTrainer && !session.trainerJoinedAt) {
    session.trainerJoinedAt = now;
    session.trainerAttended = true;
  }
  if (isClient && !session.clientJoinedAt) {
    session.clientJoinedAt = now;
    session.clientAttended = true;
  }

  // If both have joined, mark as live and record call start
  if (session.trainerJoinedAt && session.clientJoinedAt && session.sessionStatus === 'scheduled') {
    session.sessionStatus = 'live';
    session.callStartedAt = now;
  }

  await session.save();

  // Notify the other user via Socket.io
  const io = req.app.get('io');
  const otherUserId = isTrainer ? session.client.toString() : session.trainer.toString();
  io.to(otherUserId).emit('session_user_joined', {
    roomId,
    role: isTrainer ? 'trainer' : 'client',
  });

  res.json(session);
});

// ─────────────────────────────────────────────────────────
// @desc  End session — called when either user leaves the call
// @route PATCH /api/sessions/:roomId/end
// @access Private
// ─────────────────────────────────────────────────────────
const endSession = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id.toString();

  const session = await Session.findOne({ roomId });
  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  const isParticipant =
    session.trainer.toString() === userId ||
    session.client.toString() === userId;
  if (!isParticipant) {
    res.status(403);
    throw new Error('Not authorised');
  }

  if (session.sessionStatus === 'completed') {
    return res.json(session); // already ended
  }

  const now = new Date();
  session.callEndedAt = now;

  // Calculate duration
  if (session.callStartedAt) {
    const diffMs = now - new Date(session.callStartedAt);
    session.durationMinutes = Math.round(diffMs / 60000);
  }

  // Determine final status
  if (session.trainerAttended && session.clientAttended) {
    session.sessionStatus = 'completed';
  } else if (!session.trainerAttended && !session.clientAttended) {
    session.sessionStatus = 'missed';
  } else {
    // One person showed up
    session.sessionStatus = 'completed';
  }

  await session.save();

  // Also update the booking status to completed
  await Booking.findByIdAndUpdate(session.booking, { status: 'completed' });

  // Notify both users
  const io = req.app.get('io');
  io.to(session.trainer.toString()).emit('session_ended', { roomId, session });
  io.to(session.client.toString()).emit('session_ended',  { roomId, session });

  res.json(session);
});

// ─────────────────────────────────────────────────────────
// @desc  Get all sessions for the logged-in user
// @route GET /api/sessions/my
// @access Private
// ─────────────────────────────────────────────────────────
const getMySessions = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const sessions = await Session.find({
    $or: [{ trainer: userId }, { client: userId }],
  })
    .populate('booking', 'sessionDate sessionTime price notes')
    .populate('trainer', 'name email')
    .populate('client',  'name email')
    .sort({ createdAt: -1 });

  res.json(sessions);
});

module.exports = { getOrCreateSession, joinSession, endSession, getMySessions };