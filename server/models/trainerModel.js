const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sessions: { type: Number, required: true },
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const trainerSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    bio: {
      type: String,
      default: '',
    },
    specialty: {
      type: String,
      default: 'Gym',
    },
    price: {
      type: Number,
      default: 0,
    },
    experience: {
      type: Number,
      default: 0,
    },
    profileImage: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: 'Kathmandu, Nepal',
    },
    languages: {
      type: [String],
      default: ['Nepali'],
    },
    certifications: {
      type: [String],
      default: [],
    },
    timeSlots: {
      type: [String],
      default: [],
    },
    packages: {
      type: [packageSchema],
      default: [],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      default: 0,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    verificationStatus: {
      type: String,
      enum: ['not_submitted', 'pending', 'approved', 'rejected', 'resubmit_required'],
      default: 'not_submitted',
    },
    verificationDocuments: {
      certificateImage: {
        type: String,
        default: '',
      },
      citizenshipFrontImage: {
        type: String,
        default: '',
      },
      citizenshipBackImage: {
        type: String,
        default: '',
      },
    },
    verificationSubmittedAt: {
      type: Date,
      default: null,
    },
    verificationReviewedAt: {
      type: Date,
      default: null,
    },
    verificationNote: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TrainerProfile', trainerSchema);
