import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Server, Channel, Message } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { useWebRTC } from '../hooks/useWebRTC';

interface DiscordContextType {
  servers: Server[];
  activeServer: Server | null;
  channels: Channel[];
  activeChannel: Channel | null;
  messages: Message[];
  isLoadingMessages: boolean;
  typingUsers: string[];
  webrtc: ReturnType<typeof useWebRTC>;
  selectServer: (serverId: string) => Promise<void>;
  selectChannel: (channel: Channel) => void;
  sendMessage: (content: string) => Promise<void>;
  sendTyping: () => void;
  sendStopTyping: () => void;
  refreshServers: () => Promise<void>;
  refreshChannels: () => Promise<void>;
  deleteChannel: (channelId: string) => Promise<void>;
}

const DiscordContext = createContext<DiscordContextType | undefined>(undefined);

export const DiscordProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const webrtc = useWebRTC(socket, user);

  const [servers, setServers] = useState<Server[]>([]);
  const [activeServer, setActiveServer] = useState<Server | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // Select a server by ID
  const selectServer = useCallback(async (serverId: string) => {
    try {
      const res = await api.servers.getById(serverId);
      const server: Server = res.server;
      setActiveServer(server);
      setChannels(server.channels || []);

      // Pick first text channel by default if none selected or if active channel belongs to other server
      if (server.channels && server.channels.length > 0) {
        const defaultChannel = server.channels.find((c) => c.type === 'text') || server.channels[0];
        setActiveChannel(defaultChannel);
      } else {
        setActiveChannel(null);
      }
    } catch (err) {
      console.error('[DiscordContext] Error selecting server:', err);
    }
  }, []);

  // Load all user's servers
  const refreshServers = useCallback(async () => {
    try {
      const res = await api.servers.getAll();
      setServers(res.servers || []);

      // If active server is still in list, update it; otherwise pick first
      if (res.servers && res.servers.length > 0) {
        if (!activeServer || !res.servers.some((s: Server) => s._id === activeServer._id)) {
          await selectServer(res.servers[0]._id);
        }
      } else {
        setActiveServer(null);
        setChannels([]);
        setActiveChannel(null);
      }
    } catch (err) {
      console.error('[DiscordContext] Error fetching servers:', err);
    }
  }, [activeServer, selectServer]);

  // Reload channels for active server
  const refreshChannels = useCallback(async () => {
    if (!activeServer) return;
    try {
      const res = await api.servers.getById(activeServer._id);
      setChannels(res.server.channels || []);
    } catch (err) {
      console.error('[DiscordContext] Error refreshing channels:', err);
    }
  }, [activeServer]);

  // Select a channel
  const selectChannel = useCallback((channel: Channel) => {
    setActiveChannel(channel);
  }, []);

  // Fetch messages when active text channel changes
  useEffect(() => {
    if (!activeChannel || activeChannel.type !== 'text') {
      setMessages([]);
      return;
    }

    let isMounted = true;
    setIsLoadingMessages(true);

    api.messages
      .getByChannel(activeChannel._id)
      .then((res) => {
        if (isMounted) {
          setMessages(res.messages || []);
        }
      })
      .catch((err) => {
        console.error('[DiscordContext] Error fetching messages:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingMessages(false);
      });

    // Join channel via socket
    if (socket) {
      socket.emit('join_channel', activeChannel._id);
    }

    return () => {
      isMounted = false;
      if (socket && activeChannel) {
        socket.emit('leave_channel', activeChannel._id);
      }
    };
  }, [activeChannel, socket]);

  // Listen for socket chat events
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg: Message) => {
      if (activeChannel && newMsg.channelId === activeChannel._id) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
      }
    };

    const handleUserTyping = ({ channelId, username }: { channelId: string; username: string }) => {
      if (activeChannel && channelId === activeChannel._id && username !== user?.username) {
        setTypingUsers((prev) => {
          if (!prev.includes(username)) return [...prev, username];
          return prev;
        });
      }
    };

    const handleUserStopTyping = ({ channelId, userId }: { channelId: string; userId: string }) => {
      if (activeChannel && channelId === activeChannel._id) {
        setTypingUsers((prev) => prev.filter((u) => u !== userId));
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
    };
  }, [socket, activeChannel, user]);

  // Send message
  const sendMessage = async (content: string) => {
    if (!activeChannel || !content.trim()) return;

    try {
      const res = await api.messages.create({
        channelId: activeChannel._id,
        content
      });

      // Emit through independent socket server for instant delivery to peers
      if (socket) {
        socket.emit('send_message', res.message);
      }

      // Optimistically append to local state if not already received
      setMessages((prev) => {
        if (prev.some((m) => m._id === res.message._id)) return prev;
        return [...prev, res.message];
      });
    } catch (err) {
      console.error('[DiscordContext] Error sending message:', err);
      throw err;
    }
  };

  const sendTyping = () => {
    if (socket && activeChannel) {
      socket.emit('typing', { channelId: activeChannel._id, username: user?.username });
    }
  };

  const sendStopTyping = () => {
    if (socket && activeChannel) {
      socket.emit('stop_typing', { channelId: activeChannel._id });
    }
  };

  const deleteChannel = async (channelId: string) => {
    await api.channels.delete(channelId);
    await refreshChannels();
    if (activeChannel?._id === channelId) {
      const remaining = channels.filter((c) => c._id !== channelId);
      setActiveChannel(remaining[0] || null);
    }
  };

  // Initial load
  useEffect(() => {
    if (user) {
      refreshServers();
    }
  }, [user, refreshServers]);

  return (
    <DiscordContext.Provider
      value={{
        servers,
        activeServer,
        channels,
        activeChannel,
        messages,
        isLoadingMessages,
        typingUsers,
        webrtc,
        selectServer,
        selectChannel,
        sendMessage,
        sendTyping,
        sendStopTyping,
        refreshServers,
        refreshChannels,
        deleteChannel
      }}
    >
      {children}
    </DiscordContext.Provider>
  );
};

export const useDiscord = () => {
  const context = useContext(DiscordContext);
  if (!context) {
    throw new Error('useDiscord must be used within a DiscordProvider');
  }
  return context;
};
