import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5001';

let socket: Socket | null = null;

export const initSocket = (token?: string, user?: { id: string; username: string; avatarColor: string }): Socket => {
  if (socket) {
    if (socket.connected) {
      return socket;
    }
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth: {
      token: token || localStorage.getItem('discordx_token') || '',
      userId: user?.id,
      username: user?.username,
      avatarColor: user?.avatarColor
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000
  });

  socket.on('connect', () => {
    console.log('[Socket Service] Connected to independent socket server:', socket?.id);
  });

  socket.on('connect_error', (error) => {
    console.warn('[Socket Service] Socket connection error:', error.message);
  });

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
