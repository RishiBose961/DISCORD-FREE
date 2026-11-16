const Server = require('../models/Server');
const Channel = require('../models/Channel');
const User = require('../models/User');

const SERVER_COLORS = ['#5865F2', '#3BA55C', '#FAA61A', '#EB459E', '#ED4245', '#9B59B6'];

// Get all servers the current user belongs to
exports.getUserServers = async (req, res, next) => {
  try {
    const servers = await Server.find({
      'members.user': req.user._id
    })
      .select('name description iconColor iconText inviteCode createdAt owner channels')
      .populate('channels', 'name type topic')
      .sort({ createdAt: 1 });

    res.json({ servers });
  } catch (error) {
    next(error);
  }
};

// Get single server by ID with channels and member details
exports.getServerById = async (req, res, next) => {
  try {
    const server = await Server.findById(req.params.id)
      .populate('channels')
      .populate({
        path: 'members.user',
        select: 'username avatarColor status customStatus'
      })
      .populate('owner', 'username avatarColor status');

    if (!server) {
      return res.status(404).json({ message: 'Server not found.' });
    }

    const isMember = server.members.some(
      (m) => m.user && m.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this server.' });
    }

    res.json({ server });
  } catch (error) {
    next(error);
  }
};

// Create a new server
exports.createServer = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: 'Server name must be at least 2 characters.' });
    }

    const trimmedName = name.trim();
    const iconColor = SERVER_COLORS[Math.floor(Math.random() * SERVER_COLORS.length)];
    const words = trimmedName.split(' ');
    const iconText = words.length > 1
      ? (words[0][0] + words[1][0]).toUpperCase()
      : trimmedName.substring(0, 2).toUpperCase();

    const newServer = await Server.create({
      name: trimmedName,
      description: description ? description.trim() : '',
      iconColor,
      iconText,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'owner' }]
    });

    // Create default text & voice channels
    const defaultText = await Channel.create({
      name: 'general',
      type: 'text',
      serverId: newServer._id,
      topic: 'General discussions'
    });

    const defaultVoice = await Channel.create({
      name: 'General Voice',
      type: 'voice',
      serverId: newServer._id,
      topic: 'Voice talk and calling'
    });

    newServer.channels = [defaultText._id, defaultVoice._id];
    await newServer.save();

    await User.findByIdAndUpdate(req.user._id, {
      $push: { servers: newServer._id }
    });

    const populatedServer = await Server.findById(newServer._id)
      .populate('channels')
      .populate({
        path: 'members.user',
        select: 'username avatarColor status customStatus'
      });

    res.status(201).json({ server: populatedServer });
  } catch (error) {
    next(error);
  }
};

// Join a server using invite code
exports.joinServer = async (req, res, next) => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({ message: 'Invite code is required.' });
    }

    const server = await Server.findOne({ inviteCode: inviteCode.trim().toUpperCase() });
    if (!server) {
      return res.status(404).json({ message: 'Invalid or expired invite code.' });
    }

    const isMember = server.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (isMember) {
      return res.status(400).json({ message: 'You are already a member of this server.' });
    }

    server.members.push({ user: req.user._id, role: 'member' });
    await server.save();

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { servers: server._id }
    });

    const populatedServer = await Server.findById(server._id)
      .populate('channels')
      .populate({
        path: 'members.user',
        select: 'username avatarColor status customStatus'
      });

    res.json({ message: 'Joined server successfully', server: populatedServer });
  } catch (error) {
    next(error);
  }
};

// Leave a server
exports.leaveServer = async (req, res, next) => {
  try {
    const server = await Server.findById(req.params.id);
    if (!server) {
      return res.status(404).json({ message: 'Server not found.' });
    }

    if (server.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Server owner cannot leave. Transfer ownership or delete server.' });
    }

    server.members = server.members.filter(
      (m) => m.user.toString() !== req.user._id.toString()
    );
    await server.save();

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { servers: server._id }
    });

    res.json({ message: 'Left server successfully', serverId: server._id });
  } catch (error) {
    next(error);
  }
};

// Delete server (owner only)
exports.deleteServer = async (req, res, next) => {
  try {
    const server = await Server.findById(req.params.id);
    if (!server) {
      return res.status(404).json({ message: 'Server not found.' });
    }

    if (server.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only server owner can delete this server.' });
    }

    // Delete associated channels
    await Channel.deleteMany({ serverId: server._id });

    // Remove server reference from all member users
    await User.updateMany(
      { servers: server._id },
      { $pull: { servers: server._id } }
    );

    await Server.findByIdAndDelete(server._id);

    res.json({ message: 'Server deleted successfully', serverId: server._id });
  } catch (error) {
    next(error);
  }
};
