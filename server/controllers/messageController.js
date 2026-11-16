const Message = require('../models/Message');
const Channel = require('../models/Channel');
const Server = require('../models/Server');

// Get messages for a channel
exports.getMessages = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found.' });
    }

    const messages = await Message.find({ channelId })
      .populate('sender', 'username avatarColor status')
      .sort({ createdAt: -1 })
      .limit(limit);

    // Return in chronological order
    res.json({ messages: messages.reverse() });
  } catch (error) {
    next(error);
  }
};

// Create a new message
exports.createMessage = async (req, res, next) => {
  try {
    const { channelId, content } = req.body;

    if (!channelId || !content || !content.trim()) {
      return res.status(400).json({ message: 'Channel ID and message content are required.' });
    }

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found.' });
    }

    // Verify user is member of the server
    const server = await Server.findById(channel.serverId);
    if (!server) {
      return res.status(404).json({ message: 'Server not found.' });
    }

    const isMember = server.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'You must be a member of this server to post messages.' });
    }

    const message = await Message.create({
      channelId,
      sender: req.user._id,
      content: content.trim()
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username avatarColor status');

    res.status(201).json({ message: populatedMessage });
  } catch (error) {
    next(error);
  }
};

// Delete a message
exports.deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found.' });
    }

    // Check if requester is message sender or server owner/admin
    const channel = await Channel.findById(message.channelId);
    const server = channel ? await Server.findById(channel.serverId) : null;
    const isSender = message.sender.toString() === req.user._id.toString();
    const isOwner = server && server.owner.toString() === req.user._id.toString();

    if (!isSender && !isOwner) {
      return res.status(403).json({ message: 'You do not have permission to delete this message.' });
    }

    await Message.findByIdAndDelete(id);

    res.json({ message: 'Message deleted successfully', messageId: id });
  } catch (error) {
    next(error);
  }
};
