const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true, // one session record per online booking
    },
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // room name used for WebRTC signaling — generated from booking _id
    roomId: {
      type: String,
      required: true,
      unique: true,
    },
    // Official session lifecycle status
    sessionStatus: {
      type: String,
      enum: ['scheduled', 'live', 'completed', 'missed', 'cancelled'],
      default: 'scheduled',
    },
    // Attendance tracking
    trainerJoinedAt: { type: Date, default: null },
    clientJoinedAt:  { type: Date, default: null },
    callStartedAt:   { type: Date, default: null }, // when BOTH have joined
    callEndedAt:     { type: Date, default: null },
    durationMinutes: { type: Number, default: null },
    trainerAttended: { type: Boolean, default: false },
    clientAttended:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Session', sessionSchema);