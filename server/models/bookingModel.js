const mongoose = require('mongoose');

const bookingSchema = mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Booking must have a client'],
    },
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Booking must have a trainer'],
    },

    sessionDate: {
      type: String,
      required: [true, 'Please provide a session date'],
    },
    sessionTime: {
      type: String,
      required: [true, 'Please provide a session time'],
    },
    sessionType: {
      type: String,
      enum: ['Online', 'In-Person'],
      required: [true, 'Please specify session type'],
      default: 'Online',
    },

    price: {
      type: Number,
      required: [true, 'Please provide a session price'],
    },

    status: {
      type: String,
      enum: [
        'pending',
        'accepted_awaiting_payment',
        'confirmed',
        'rejected',
        'cancelled',
        'completed',
      ],
      default: 'pending',
    },

    paymentStatus: {
      type: String,
      enum: ['unpaid', 'pending', 'paid', 'failed', 'refunded'],
      default: 'unpaid',
    },

    paymentMethod: {
      type: String,
      enum: ['khalti', 'esewa', 'cash', 'none'],
      default: 'none',
    },

    paymentExpiresAt: {
      type: Date,
      default: null,
    },

    totalAmount: {
      type: Number,
      default: 0,
    },

    platformFee: {
      type: Number,
      default: 0,
    },

    trainerEarning: {
      type: Number,
      default: 0,
    },

    platformFeePercent: {
      type: Number,
      default: 10,
    },

    khaltiPidx: {
      type: String,
      default: '',
    },

    khaltiTransactionId: {
      type: String,
      default: '',
    },

    paidAt: {
      type: Date,
      default: null,
    },

    payoutStatus: {
      type: String,
      enum: ['held', 'released'],
      default: 'held',
    },

    payoutReleasedAt: {
      type: Date,
      default: null,
    },

    notes: {
      type: String,
      default: '',
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Booking', bookingSchema);
