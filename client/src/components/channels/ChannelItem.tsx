import React from 'react';
import { Hash, Volume2, Video, Trash2, Mic, MicOff, PhoneCall } from 'lucide-react';
import type { Channel } from '../../types';
import { useDiscord } from '../../context/DiscordContext';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';

interface ChannelItemProps {
  channel: Channel;
}

export const ChannelItem: React.FC<ChannelItemProps> = ({ channel }) => {
  const { activeChannel, selectChannel, webrtc, deleteChannel, activeServer } = useDiscord();
  const { voiceRoomsSummary } = useSocket();
  const { user } = useAuth();

  const isActive = activeChannel?._id === channel._id;
  const isVoiceOrVideo = channel.type === 'voice' || channel.type === 'video';
  const participants = voiceRoomsSummary[channel._id] || [];
  const isConnectedHere = webrtc.currentRoomId === channel._id;

  const handleClick = () => {
    selectChannel(channel);
  };

  const handleQuickJoin = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectChannel(channel);
    if (!isConnectedHere) {
      webrtc.joinVoiceRoom(channel._id, channel.type === 'voice');
    }
  };

  const isOwner = activeServer?.owner === user?.id || (typeof activeServer?.owner === 'object' && activeServer?.owner?.id === user?.id);

  const getIcon = () => {
    if (channel.type === 'text') return <Hash size={18} />;
    if (channel.type === 'voice') return <Volume2 size={18} color="#23a55a" />;
    return <Video size={18} color="#5865F2" />;
  };

  return (
    <div>
      <div
        className={`channel-item ${isActive ? 'active' : ''} ${isConnectedHere ? 'connected-voice' : ''}`}
        onClick={handleClick}
      >
        <div className="channel-item-left">
          {getIcon()}
          <span className="channel-name">{channel.name}</span>
          {isConnectedHere && (
            <span
              style={{
                fontSize: 10,
                backgroundColor: '#23a55a',
                color: '#fff',
                padding: '1px 5px',
                borderRadius: 4,
                fontWeight: 700
              }}
            >
              CONNECTED
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {isVoiceOrVideo && !isConnectedHere && (
            <button
              className="add-channel-icon-btn"
              onClick={handleQuickJoin}
              title="Quick Join Room"
              style={{ color: '#23a55a' }}
            >
              <PhoneCall size={14} />
            </button>
          )}

          {isOwner && (
            <button
              className="add-channel-icon-btn"
              style={{ opacity: 0.6 }}
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete channel #${channel.name}?`)) {
                  deleteChannel(channel._id);
                }
              }}
              title="Delete Channel"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Render active voice participants inside this channel in the sidebar */}
      {isVoiceOrVideo && participants.length > 0 && (
        <div className="voice-participants-sublist">
          {participants.map((p) => {
            const isLocal = p.userId === user?.id;
            const speaking = isLocal ? (!webrtc.isMuted && webrtc.connectionState === 'connected') : p.isSpeaking;
            const muted = isLocal ? webrtc.isMuted : p.isMuted;

            return (
              <div
                key={p.socketId}
                className={`voice-participant-tag ${speaking ? 'speaking' : ''}`}
              >
                <Avatar
                  username={p.username}
                  color={p.avatarColor}
                  size={20}
                  fontSize={10}
                />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.username} {isLocal && '(You)'}
                </span>
                {muted ? (
                  <MicOff size={12} color="#f23f43" />
                ) : (
                  <Mic size={12} color={speaking ? '#23a55a' : '#80848e'} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
