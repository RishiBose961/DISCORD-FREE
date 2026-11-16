const mongoose = require('mongoose');

const ChannelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Channel name is required'],
      trim: true,
      lowercase: true,
      maxlength: [50, 'Channel name cannot exceed 50 characters']
    },
    type: {
      type: String,
      enum: ['text', 'voice', 'video'],
      default: 'text'
    },
    serverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Server',
      required: true,
      index: true
    },
    topic: {
      type: String,
      default: '',
      maxlength: [200, 'Topic cannot exceed 200 characters']
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Channel', ChannelSchema);
