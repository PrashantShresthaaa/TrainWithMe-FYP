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
    content: {
      type: String,
      default: '',
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
      trim: true,
    },
    // For image/file messages
    fileUrl: {
      type: String,
      default: null,
    },
    fileType: {
      type: String,
      enum: ['image', 'pdf', 'file', null],
      default: null,
    },
    fileName: {
      type: String,
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
    },
    // true = sender has no booking with receiver
    isRequest: {
      type: Boolean,
      default: false,
    },
    // receiver accepted the request
    requestAccepted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);