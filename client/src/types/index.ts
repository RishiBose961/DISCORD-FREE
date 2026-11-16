export interface User {
  id: string;
  username: string;
  email?: string;
  avatarColor: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  customStatus?: string;
}

export interface Channel {
  _id: string;
  name: string;
  type: 'text' | 'voice' | 'video';
  serverId: string;
  topic?: string;
  createdAt: string;
}

export interface ServerMember {
  user: User;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

export interface Server {
  _id: string;
  name: string;
  description?: string;
  iconColor: string;
  iconText: string;
  owner: string | User;
  members: ServerMember[];
  channels: Channel[];
  inviteCode?: string;
  createdAt: string;
}

export interface Message {
  _id: string;
  channelId: string;
  sender: User;
  content: string;
  createdAt: string;
}

export interface VoiceParticipant {
  socketId: string;
  userId: string;
  username: string;
  avatarColor: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isSpeaking: boolean;
  stream?: MediaStream;
}

export interface VoiceRoomSummary {
  [roomId: string]: VoiceParticipant[];
}
