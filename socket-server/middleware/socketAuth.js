const jwt = require('jsonwebtoken');

const socketAuth = (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers?.authorization &&
        socket.handshake.headers.authorization.split(' ')[1]);

    if (token) {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'super_secret_discordx_jwt_key_2026'
      );
      socket.user = {
        id: decoded.id,
        username: socket.handshake.auth?.username || 'User',
        avatarColor: socket.handshake.auth?.avatarColor || '#5865F2'
      };
    } else {
      // Allow guest/temporary identity if no token provided during testing
      socket.user = {
        id: socket.handshake.auth?.userId || socket.id,
        username: socket.handshake.auth?.username || `Guest_${socket.id.substring(0, 4)}`,
        avatarColor: socket.handshake.auth?.avatarColor || '#5865F2'
      };
    }
    next();
  } catch (error) {
    // If token verification failed, treat as guest or reject
    console.warn('[Socket Auth Warning]: Token verification failed, fallback to socket ID', error.message);
    socket.user = {
      id: socket.id,
      username: socket.handshake.auth?.username || `User_${socket.id.substring(0, 4)}`,
      avatarColor: socket.handshake.auth?.avatarColor || '#5865F2'
    };
    next();
  }
};

module.exports = socketAuth;
