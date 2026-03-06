const mongoose = require('mongoose');

// ── Package sub-schema ──
const packageSchema = new mongoose.Schema({
  name:        { type: String, required: true },   // e.g. "Monthly Grind"
  sessions:    { type: Number, required: true },   // e.g. 12
  price:       { type: Number, required: true },   // total price e.g. 15000
  discount:    { type: Number, default: 0 },       // % discount shown to client
  description: { type: String, default: '' },      // e.g. "12 sessions over a month"
  isActive:    { type: Boolean, default: true },   // trainer can hide a package
}, { _id: true });

const trainerSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },

    // ── Core fields (existing) ──
    bio: {
      type: String,
      default: '',
    },
    specialty: {
      type: String,
      default: 'Gym',
    },
    price: {
      type: Number,   // hourly/per-session base rate
      default: 0,
    },
    experience: {
      type: Number,
      default: 0,
    },

    // ── New fields ──
    profileImage: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: 'Kathmandu, Nepal',
    },
    languages: {
      type: [String],   // e.g. ["Nepali", "English"]
      default: ['Nepali'],
    },
    certifications: {
      type: [String],   // e.g. ["NASM CPT", "Yoga Alliance RYT-200"]
      default: [],
    },
    // Available time slots — array of strings like "Mon 7:00 AM"
    timeSlots: {
      type: [String],
      default: [],
    },

    // ── Packages ──
    packages: {
      type: [packageSchema],
      default: [],
    },

    // ── System fields ──
    isVerified: { type: Boolean, default: false },
    rating:     { type: Number,  default: 0 },
    numReviews: { type: Number,  default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TrainerProfile', trainerSchema);