require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const { corsOptions } = require('./config/socketConfig');
const socketAuth = require('./middleware/socketAuth');
const chatHandler = require('./handlers/chatHandler');
const { voiceVideoHandler, getVoiceRoomsSummary } = require('./handlers/voiceVideoHandler');
const userStatusHandler = require('./handlers/userStatusHandler');

const PORT = process.env.PORT || 5001;

// Create standalone HTTP server for socket
const server = http.createServer((req, res) => {
  // Simple health check endpoint for monitoring
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'healthy',
        service: 'DiscordX Standalone Socket & WebRTC Signaling Server',
        port: PORT,
        activeVoiceRooms: Object.keys(getVoiceRoomsSummary()).length,
        timestamp: new Date().toISOString()
      })
    );
    return;
  }
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

// Initialize Socket.io instance
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Middleware for auth & identification
io.use(socketAuth);

// Connection listener
io.on('connection', (socket) => {
  console.log(`[Socket Connected] ID: ${socket.id} | User: ${socket.user?.username} (${socket.user?.id})`);

  // Send initial active voice rooms summary
  socket.emit('voice_rooms_update', getVoiceRoomsSummary());

  // Attach handlers
  chatHandler(io, socket);
  voiceVideoHandler(io, socket);
  userStatusHandler(io, socket);

  socket.on('error', (err) => {
    console.error(`[Socket Error] ${socket.id}:`, err);
  });
});

server.listen(PORT, () => {
  console.log(`[Socket Server] DiscordX Independent Socket & WebRTC Server listening on http://localhost:${PORT}`);
});
