// Map of userId -> Set of socketIds
const onlineUsers = new Map();
// Map of userId -> { status, customStatus, username, avatarColor }
const userPresence = new Map();

const userStatusHandler = (io, socket) => {
  const user = socket.user;
  if (!user || !user.id) return;

  const userId = user.id.toString();

  // Track socket under user
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId).add(socket.id);

  userPresence.set(userId, {
    userId,
    username: user.username,
    avatarColor: user.avatarColor,
    status: 'online',
    lastSeen: new Date()
  });

  // Broadcast user online to all connected clients
  io.emit('user_status_change', {
    userId,
    status: 'online',
    username: user.username
  });

  // Send current online user IDs to the connecting socket
  socket.emit('online_users_list', Array.from(onlineUsers.keys()));

  // User changes status (e.g. 'idle', 'dnd', 'offline')
  socket.on('set_status', ({ status, customStatus }) => {
    if (userPresence.has(userId)) {
      const presence = userPresence.get(userId);
      if (status) presence.status = status;
      if (customStatus !== undefined) presence.customStatus = customStatus;

      io.emit('user_status_change', {
        userId,
        status: presence.status,
        customStatus: presence.customStatus,
        username: presence.username
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    if (onlineUsers.has(userId)) {
      const userSockets = onlineUsers.get(userId);
      userSockets.delete(socket.id);

      // If user has no more open tabs/connections
      if (userSockets.size === 0) {
        onlineUsers.delete(userId);
        if (userPresence.has(userId)) {
          userPresence.get(userId).status = 'offline';
        }
        io.emit('user_status_change', {
          userId,
          status: 'offline',
          username: user.username
        });
      }
    }
    console.log(`[Presence] Socket ${socket.id} (${user.username}) disconnected`);
  });
};

module.exports = userStatusHandler;
