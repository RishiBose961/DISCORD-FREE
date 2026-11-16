const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel',
      required: true,
      index: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: [true, 'Message content cannot be empty'],
      trim: true,
      maxlength: [4000, 'Message cannot exceed 4000 characters']
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Message', MessageSchema);
