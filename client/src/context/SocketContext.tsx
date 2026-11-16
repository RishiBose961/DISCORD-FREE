import React, { createContext, useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { initSocket } from '../services/socket';
import type { VoiceRoomSummary } from '../types';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
  voiceRoomsSummary: VoiceRoomSummary;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [voiceRoomsSummary, setVoiceRoomsSummary] = useState<VoiceRoomSummary>({});

  useEffect(() => {
    if (user && token) {
      const s = initSocket(token, {
        id: user.id,
        username: user.username,
        avatarColor: user.avatarColor
      });
      setSocket(s);

      const onConnect = () => setIsConnected(true);
      const onDisconnect = () => setIsConnected(false);

      const onOnlineUsersList = (users: string[]) => {
        setOnlineUsers(new Set(users));
      };

      const onUserStatusChange = ({ userId, status }: { userId: string; status: string }) => {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          if (status === 'offline') {
            next.delete(userId);
          } else {
            next.add(userId);
          }
          return next;
        });
      };

      const onVoiceRoomsUpdate = (summary: VoiceRoomSummary) => {
        setVoiceRoomsSummary(summary || {});
      };

      s.on('connect', onConnect);
      s.on('disconnect', onDisconnect);
      s.on('online_users_list', onOnlineUsersList);
      s.on('user_status_change', onUserStatusChange);
      s.on('voice_rooms_update', onVoiceRoomsUpdate);

      return () => {
        s.off('connect', onConnect);
        s.off('disconnect', onDisconnect);
        s.off('online_users_list', onOnlineUsersList);
        s.off('user_status_change', onUserStatusChange);
        s.off('voice_rooms_update', onVoiceRoomsUpdate);
      };
    } else {
      setSocket(null);
      setIsConnected(false);
    }
  }, [user, token]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineUsers, voiceRoomsSummary }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
