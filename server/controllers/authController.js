const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Server = require('../models/Server');
const Channel = require('../models/Channel');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_discordx_jwt_key_2026', {
    expiresIn: '30d'
  });
};

// Register user
exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide username, email, and password.' });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.trim() }]
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return res.status(400).json({ message: 'Email is already registered.' });
      }
      return res.status(400).json({ message: 'Username is already taken.' });
    }

    const user = await User.create({
      username: username.trim(),
      email: email.toLowerCase(),
      password
    });

    // Automatically create a default starter server for new user if no server exists
    let defaultServer = await Server.findOne({ name: 'General Community' });
    if (!defaultServer) {
      defaultServer = await Server.create({
        name: 'General Community',
        description: 'Welcome to DiscordX! Talk, chat, and video call freely.',
        owner: user._id,
        iconColor: '#5865F2',
        iconText: 'GC',
        members: [{ user: user._id, role: 'owner' }]
      });

      // Create default channels: text, voice, video
      const generalText = await Channel.create({
        name: 'general',
        type: 'text',
        serverId: defaultServer._id,
        topic: 'General chatter and discussions'
      });

      const devTalk = await Channel.create({
        name: 'dev-talk',
        type: 'text',
        serverId: defaultServer._id,
        topic: 'Code, tech, and DiscordX discussions'
      });

      const voiceRoom = await Channel.create({
        name: 'General Voice',
        type: 'voice',
        serverId: defaultServer._id,
        topic: 'Drop in to talk with voice'
      });

      const videoRoom = await Channel.create({
        name: 'Video Lounge',
        type: 'video',
        serverId: defaultServer._id,
        topic: 'Face-to-face video calling & screen sharing'
      });

      defaultServer.channels = [generalText._id, devTalk._id, voiceRoom._id, videoRoom._id];
      await defaultServer.save();
    } else {
      // Add user to existing General Community
      const isMember = defaultServer.members.some(
        (m) => m.user.toString() === user._id.toString()
      );
      if (!isMember) {
        defaultServer.members.push({ user: user._id, role: 'member' });
        await defaultServer.save();
      }
    }

    user.servers.push(defaultServer._id);
    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatarColor: user.avatarColor,
        status: user.status,
        customStatus: user.customStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({ message: 'Please enter email or username and password.' });
    }

    const query = emailOrUsername.includes('@')
      ? { email: emailOrUsername.toLowerCase().trim() }
      : { username: emailOrUsername.trim() };

    const user = await User.findOne(query);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatarColor: user.avatarColor,
        status: user.status,
        customStatus: user.customStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get current authenticated user
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatarColor: user.avatarColor,
        status: user.status,
        customStatus: user.customStatus
      }
    });
  } catch (error) {
    next(error);
  }
};
