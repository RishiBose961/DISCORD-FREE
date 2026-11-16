const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AVATAR_COLORS = [
  '#5865F2', // Discord Blurple
  '#57F287', // Green
  '#FEE75C', // Yellow
  '#EB459E', // Fuchsia
  '#ED4245', // Red
  '#3BA55C', // Emerald
  '#FAA61A', // Orange
  '#9B59B6', // Purple
  '#1ABC9C'  // Teal
];

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [32, 'Username cannot exceed 32 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters']
    },
    avatarColor: {
      type: String,
      default: () => AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
    },
    status: {
      type: String,
      enum: ['online', 'idle', 'dnd', 'offline'],
      default: 'online'
    },
    customStatus: {
      type: String,
      default: '',
      maxlength: [120, 'Status cannot exceed 120 characters']
    },
    servers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Server'
      }
    ]
  },
  {
    timestamps: true
  }
);

// Hash password before saving
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password when serializing to JSON
UserSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', UserSchema);
