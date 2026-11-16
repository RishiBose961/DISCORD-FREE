const chatHandler = (io, socket) => {
  // Join a text channel room
  socket.on('join_channel', (channelId) => {
    if (!channelId) return;
    const roomName = `channel:${channelId}`;
    socket.join(roomName);
    console.log(`[Chat] Socket ${socket.id} (${socket.user?.username}) joined ${roomName}`);
  });

  // Leave a text channel room
  socket.on('leave_channel', (channelId) => {
    if (!channelId) return;
    const roomName = `channel:${channelId}`;
    socket.leave(roomName);
    console.log(`[Chat] Socket ${socket.id} left ${roomName}`);
  });

  // Relay chat message to channel subscribers in real time
  socket.on('send_message', (messageData) => {
    if (!messageData || !messageData.channelId) return;
    const roomName = `channel:${messageData.channelId}`;
    // Broadcast to everyone in channel (including sender or sender can append optimistically)
    io.to(roomName).emit('new_message', messageData);
  });

  // Typing indicator
  socket.on('typing', ({ channelId, username }) => {
    if (!channelId) return;
    socket.to(`channel:${channelId}`).emit('user_typing', {
      channelId,
      userId: socket.user?.id,
      username: username || socket.user?.username
    });
  });

  socket.on('stop_typing', ({ channelId }) => {
    if (!channelId) return;
    socket.to(`channel:${channelId}`).emit('user_stop_typing', {
      channelId,
      userId: socket.user?.id
    });
  });
};

module.exports = chatHandler;
