const mongoose = require('mongoose');

const bookingSchema = mongoose.Schema(
  {
    // --- The two parties involved ---
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

    // --- Session Details ---
    sessionDate: {
      type: String, // e.g. "Mon 24" - matches your ExploreView date buttons
      required: [true, 'Please provide a session date'],
    },
    sessionTime: {
      type: String, // e.g. "07:00 AM" - matches your ExploreView time slots
      required: [true, 'Please provide a session time'],
    },
    sessionType: {
      type: String,
      enum: ['Online', 'In-Person'],
      required: [true, 'Please specify session type'],
      default: 'Online',
    },

    // --- Pricing (snapshot at time of booking - protects against future price changes) ---
    price: {
      type: Number,
      required: [true, 'Please provide a session price'],
    },

    // --- Booking Lifecycle Status ---
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'],
      default: 'pending',
    },

    // --- Optional notes from client ---
    notes: {
      type: String,
      default: '',
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

module.exports = mongoose.model('Booking', bookingSchema);