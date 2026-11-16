const mongoose = require('mongoose');

const ServerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Server name is required'],
      trim: true,
      minlength: [2, 'Server name must be at least 2 characters'],
      maxlength: [100, 'Server name cannot exceed 100 characters']
    },
    description: {
      type: String,
      default: '',
      maxlength: [255, 'Description cannot exceed 255 characters']
    },
    iconColor: {
      type: String,
      default: '#5865F2'
    },
    iconText: {
      type: String,
      default: function () {
        return this.name ? this.name.substring(0, 2).toUpperCase() : 'SX';
      }
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        role: {
          type: String,
          enum: ['owner', 'admin', 'member'],
          default: 'member'
        },
        joinedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    channels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Channel'
      }
    ],
    inviteCode: {
      type: String,
      unique: true,
      sparse: true,
      default: () => Math.random().toString(36).substring(2, 8).toUpperCase()
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Server', ServerSchema);
