const User = require('../models/User');

// Update user profile (status, custom status, avatar color)
exports.updateProfile = async (req, res, next) => {
  try {
    const { status, customStatus, avatarColor } = req.body;
    const updates = {};

    if (status && ['online', 'idle', 'dnd', 'offline'].includes(status)) {
      updates.status = status;
    }

    if (customStatus !== undefined) {
      updates.customStatus = customStatus.trim();
    }

    if (avatarColor) {
      updates.avatarColor = avatarColor;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ user: updatedUser });
  } catch (error) {
    next(error);
  }
};

// Search users
exports.searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.json({ users: [] });
    }

    const users = await User.find({
      username: { $regex: q.trim(), $options: 'i' }
    })
      .select('username avatarColor status customStatus')
      .limit(20);

    res.json({ users });
  } catch (error) {
    next(error);
  }
};
