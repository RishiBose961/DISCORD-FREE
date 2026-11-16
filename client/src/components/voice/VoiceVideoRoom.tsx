import React from 'react';
import { Wifi, PhoneOff, Video, Users, Camera, CameraOff, AlertCircle, Radio } from 'lucide-react';
import type { Channel } from '../../types';
import { useDiscord } from '../../context/DiscordContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { VideoTile } from './VideoTile';
import { VoiceControls } from './VoiceControls';
import { TwitterSpaceRoom } from './TwitterSpaceRoom';
import { Avatar } from '../ui/Avatar';

interface VoiceVideoRoomProps {
  channel: Channel;
}

export const VoiceVideoRoom: React.FC<VoiceVideoRoomProps> = ({ channel }) => {
  const { webrtc, selectChannel, channels } = useDiscord();
  const { user } = useAuth();
  const { voiceRoomsSummary } = useSocket();

  const isConnected = webrtc.currentRoomId === channel._id;
  const isVoiceChannel = channel.type === 'voice';
  const isVideoChannel = channel.type === 'video';
  const participantsInRoom = voiceRoomsSummary[channel._id] || [];
  const totalParticipants = 1 + webrtc.participants.length;

  const getGridClass = () => {
    if (totalParticipants <= 1) return 'grid-1';
    if (totalParticipants === 2) return 'grid-2';
    if (totalParticipants <= 4) return 'grid-4';
    return 'grid-6';
  };

  const handleConnect = (startWithVideo: boolean) => {
    webrtc.joinVoiceRoom(channel._id, !startWithVideo);
  };

  const handleDisconnect = () => {
    webrtc.leaveVoiceRoom();
    const textChannel = channels.find((c) => c.type === 'text');
    if (textChannel) {
      selectChannel(textChannel);
    }
  };

  // If connected and it's a Voice room, show the Twitter Space audio stage!
  if (isConnected && isVoiceChannel) {
    return <TwitterSpaceRoom channel={channel} />;
  }

  // If NOT connected to this voice or video room yet, show the Room Lobby
  if (!isConnected) {
    return (
      <div
        className="voice-room-container"
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px',
          backgroundColor: '#1e1f22'
        }}
      >
        <div
          style={{
            maxWidth: 520,
            width: '100%',
            backgroundColor: '#2b2d31',
            borderRadius: 12,
            padding: 32,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            textAlign: 'center',
            gap: 20
          }}
        >
          {/* Channel Big Icon */}
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: '50%',
              backgroundColor: isVideoChannel ? 'rgba(88, 101, 242, 0.2)' : 'rgba(235, 69, 158, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isVideoChannel ? (
              <Video size={38} color="#5865F2" />
            ) : (
              <Radio size={38} color="#eb459e" />
            )}
          </div>

          <div>
            <div
              style={{
                display: 'inline-block',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: isVideoChannel ? '#5865F2' : '#eb459e',
                marginBottom: 6
              }}
            >
              {isVideoChannel ? 'Video & Screen Share Room' : 'Live Audio Space'}
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#f2f3f5', marginBottom: 6 }}>
              {channel.name}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              {channel.topic ||
                (isVideoChannel
                  ? 'Face-to-face video talk & screen sharing'
                  : 'Drop in, talk, and listen in a Twitter Space style live audio stage')}
            </p>
          </div>

          {/* Current Participants in Room Preview */}
          <div style={{ width: '100%', backgroundColor: '#1e1f22', borderRadius: 8, padding: 16 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: 10
              }}
            >
              <Users size={16} />
              <span>
                {participantsInRoom.length === 0
                  ? 'No one is currently in this room. Be the first to join!'
                  : `${participantsInRoom.length} ${
                      participantsInRoom.length === 1 ? 'person is' : 'people are'
                    } in this room`}
              </span>
            </div>

            {participantsInRoom.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {participantsInRoom.map((p) => (
                  <div
                    key={p.socketId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      backgroundColor: '#2b2d31',
                      padding: '4px 10px',
                      borderRadius: 16,
                      fontSize: 12,
                      color: '#f2f3f5'
                    }}
                  >
                    <Avatar username={p.username} color={p.avatarColor} size={20} fontSize={10} />
                    <span>{p.username}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12, width: '100%' }}>
            <button
              className="btn btn-primary"
              style={{
                flex: 1,
                padding: '14px 20px',
                fontSize: 15,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                backgroundColor: isVideoChannel ? '#5865F2' : '#eb459e'
              }}
              onClick={() => handleConnect(isVideoChannel)}
              disabled={webrtc.connectionState === 'connecting'}
            >
              {isVideoChannel ? <Camera size={20} /> : <Radio size={20} />}
              {webrtc.connectionState === 'connecting'
                ? 'Connecting...'
                : isVideoChannel
                ? 'Join Video Call'
                : 'Start / Join Space'}
            </button>

            {isVideoChannel && (
              <button
                className="btn btn-secondary"
                style={{
                  padding: '14px 18px',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 14
                }}
                onClick={() => handleConnect(false)}
                title="Join audio only without turning camera on"
              >
                <CameraOff size={18} />
                Voice Only
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // User IS connected to a Video Room! Show full WebRTC video grid and screen sharing
  return (
    <div className="voice-room-container">
      {/* Top Banner */}
      <div className="voice-room-header">
        <div className="voice-status-pill">
          <div className="voice-status-dot" />
          <Wifi size={16} />
          <span>Video Call Connected / {channel.name}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {totalParticipants} {totalParticipants === 1 ? 'person' : 'people'} in call
          </span>
          <button
            className="btn btn-danger"
            style={{
              padding: '6px 12px',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
            onClick={handleDisconnect}
          >
            <PhoneOff size={14} /> Disconnect
          </button>
        </div>
      </div>

      {/* Connection Notice / Warning if fallback occurred */}
      {webrtc.connectionNotice && (
        <div
          style={{
            backgroundColor: 'rgba(240, 178, 50, 0.2)',
            borderBottom: '1px solid rgba(240, 178, 50, 0.4)',
            color: '#f0b232',
            padding: '8px 16px',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <AlertCircle size={16} />
          <span>{webrtc.connectionNotice}</span>
        </div>
      )}

      {/* Video Grid */}
      <div className={`video-grid ${getGridClass()}`}>
        {/* Local user tile */}
        <VideoTile
          stream={webrtc.localStream}
          username={user?.username || 'You'}
          avatarColor={user?.avatarColor || '#5865F2'}
          isMuted={webrtc.isMuted}
          isVideoOff={webrtc.isVideoOff}
          isScreenSharing={webrtc.isScreenSharing}
          isSpeaking={false}
          isLocal={true}
        />

        {/* Remote users tiles */}
        {webrtc.participants.map((p) => (
          <VideoTile
            key={p.socketId}
            stream={p.stream}
            username={p.username}
            avatarColor={p.avatarColor}
            isMuted={p.isMuted}
            isVideoOff={p.isVideoOff}
            isScreenSharing={p.isScreenSharing}
            isSpeaking={p.isSpeaking}
            isLocal={false}
          />
        ))}
      </div>

      {/* Floating Bottom Video & Screen Controls */}
      <VoiceControls
        isMuted={webrtc.isMuted}
        isVideoOff={webrtc.isVideoOff}
        isScreenSharing={webrtc.isScreenSharing}
        onToggleAudio={webrtc.toggleAudio}
        onToggleVideo={webrtc.toggleVideo}
        onToggleScreenShare={webrtc.toggleScreenShare}
        onDisconnect={handleDisconnect}
      />
    </div>
  );
};
