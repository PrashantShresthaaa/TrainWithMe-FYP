const mongoose = require('mongoose');

const messageSchema = mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Text content
    content: {
      type: String,
      default: '',
      maxlength: 1000,
    },

    // File / image / voice attachment
    fileUrl:      { type: String,  default: null },
    fileType:     { type: String,  enum: ['image', 'pdf', 'file', 'voice', null], default: null },
    fileName:     { type: String,  default: null },
    fileDuration: { type: Number,  default: null }, // seconds — for voice messages

    // Read receipt
    read: { type: Boolean, default: false },

    // Message request system
    isRequest:       { type: Boolean, default: false },
    requestAccepted: { type: Boolean, default: false },

    // Call log
    isCallLog:    { type: Boolean, default: false },
    callStatus:   { type: String,  enum: ['initiated', 'accepted', 'declined', 'missed', null], default: null },
    callDuration: { type: Number,  default: null }, // seconds
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);