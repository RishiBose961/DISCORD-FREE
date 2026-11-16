const Channel = require('../models/Channel');
const Server = require('../models/Server');

// Create a new channel (text, voice, or video)
exports.createChannel = async (req, res, next) => {
  try {
    const { serverId, name, type, topic } = req.body;

    if (!serverId || !name) {
      return res.status(400).json({ message: 'Server ID and Channel Name are required.' });
    }

    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ message: 'Server not found.' });
    }

    // Check if user is a member
    const isMember = server.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'You must be a member of this server to create channels.' });
    }

    const validTypes = ['text', 'voice', 'video'];
    const channelType = validTypes.includes(type) ? type : 'text';

    // Format channel name (lowercase, replace spaces with hyphens for text channels)
    const formattedName = channelType === 'text'
      ? name.trim().toLowerCase().replace(/\s+/g, '-')
      : name.trim();

    const channel = await Channel.create({
      name: formattedName,
      type: channelType,
      serverId: server._id,
      topic: topic ? topic.trim() : ''
    });

    server.channels.push(channel._id);
    await server.save();

    res.status(201).json({ channel });
  } catch (error) {
    next(error);
  }
};

// Get channels for a server
exports.getChannelsByServer = async (req, res, next) => {
  try {
    const { serverId } = req.params;
    const channels = await Channel.find({ serverId }).sort({ createdAt: 1 });
    res.json({ channels });
  } catch (error) {
    next(error);
  }
};

// Delete a channel
exports.deleteChannel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const channel = await Channel.findById(id);

    if (!channel) {
      return res.status(404).json({ message: 'Channel not found.' });
    }

    const server = await Server.findById(channel.serverId);
    if (!server) {
      return res.status(404).json({ message: 'Server not found.' });
    }

    // Only server owner or admin can delete channels
    const member = server.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return res.status(403).json({ message: 'You do not have permission to delete this channel.' });
    }

    // Ensure at least one channel remains
    if (server.channels.length <= 1) {
      return res.status(400).json({ message: 'Cannot delete the only channel in a server.' });
    }

    await Channel.findByIdAndDelete(id);

    server.channels = server.channels.filter((c) => c.toString() !== id);
    await server.save();

    res.json({ message: 'Channel deleted successfully', channelId: id });
  } catch (error) {
    next(error);
  }
};
