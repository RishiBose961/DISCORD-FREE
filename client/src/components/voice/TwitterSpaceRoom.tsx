import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, PhoneOff, Radio, Users } from 'lucide-react';
import type { Channel, VoiceParticipant } from '../../types';
import { useDiscord } from '../../context/DiscordContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

interface TwitterSpaceRoomProps {
  channel: Channel;
}

interface FloatingReaction {
  id: string;
  emoji: string;
  xOffset: number;
}

export const TwitterSpaceRoom: React.FC<TwitterSpaceRoomProps> = ({ channel }) => {
  const { webrtc, selectChannel, channels, activeServer } = useDiscord();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  const handleDisconnect = () => {
    webrtc.leaveVoiceRoom();
    const textChannel = channels.find((c) => c.type === 'text');
    if (textChannel) {
      selectChannel(textChannel);
    }
  };

  // Socket reaction listener for Twitter Space floating emojis
  useEffect(() => {
    if (!socket) return;

    const handleReaction = ({ emoji }: { emoji: string }) => {
      const newReaction: FloatingReaction = {
        id: Math.random().toString(36).substring(2, 9),
        emoji,
        xOffset: Math.floor(Math.random() * 200) - 100 // distribute randomly around center
      };

      setReactions((prev) => [...prev, newReaction]);

      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
      }, 2200);
    };

    socket.on('space_reaction', handleReaction);

    return () => {
      socket.off('space_reaction', handleReaction);
    };
  }, [socket]);

  const sendReaction = (emoji: string) => {
    if (socket && webrtc.currentRoomId) {
      socket.emit('space_reaction', {
        roomId: webrtc.currentRoomId,
        emoji
      });
    }
  };

  // Bind remote audio streams to ensure high-fidelity voice output
  useEffect(() => {
    webrtc.participants.forEach((p) => {
      if (p.stream) {
        const audioEl = audioRefs.current.get(p.socketId);
        if (audioEl && audioEl.srcObject !== p.stream) {
          audioEl.srcObject = p.stream;
          audioEl.play().catch((err) => console.warn('[Space Audio] Play error:', err));
        }
      }
    });
  }, [webrtc.participants]);

  // Separate speakers and listeners
  const isLocalSpeaker = !webrtc.isMuted;
  const isServerOwner = activeServer?.owner === user?.id || (typeof activeServer?.owner === 'object' && activeServer?.owner?.id === user?.id);

  // Group remote participants into speakers (unmuted/talking) and listeners (muted)
  const speakers: VoiceParticipant[] = [];
  const listeners: VoiceParticipant[] = [];

  webrtc.participants.forEach((p) => {
    if (!p.isMuted || p.isSpeaking) {
      speakers.push(p);
    } else {
      listeners.push(p);
    }
  });

  const totalSpeakers = (isLocalSpeaker ? 1 : 0) + speakers.length;
  const totalListeners = (!isLocalSpeaker ? 1 : 0) + listeners.length;

  return (
    <div className="twitter-space-container">
      {/* Hidden Audio Elements for all remote peers */}
      {webrtc.participants.map((p) => (
        <audio
          key={p.socketId}
          ref={(el) => {
            if (el) audioRefs.current.set(p.socketId, el);
            else audioRefs.current.delete(p.socketId);
          }}
          autoPlay
          playsInline
          style={{ display: 'none' }}
        />
      ))}

      {/* Floating Reaction Emojis Overlay */}
      {reactions.map((r) => (
        <div
          key={r.id}
          className="floating-emoji-item"
          style={{ left: `calc(50% + ${r.xOffset}px)` }}
        >
          {r.emoji}
        </div>
      ))}

      {/* Twitter Space Header Bar */}
      <div className="space-header-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="space-live-pill">
            <div className="space-live-dot" />
            <span>LIVE TALK</span>
          </div>

          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#f2f3f5' }}>
              {channel.name}
            </h2>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {activeServer?.name} • {1 + webrtc.participants.length} in space
            </span>
          </div>
        </div>

        <button className="space-leave-btn" onClick={handleDisconnect}>
          <PhoneOff size={15} />
          Leave Space
        </button>
      </div>

      {/* Stage Body */}
      <div className="space-stage-body">
        {/* SPEAKERS SECTION */}
        <div>
          <div className="space-section-title">
            <Radio size={16} color="#5865F2" />
            <span>Speakers ({totalSpeakers})</span>
          </div>

          <div className="space-speakers-grid">
            {/* Local User (You) if unmuted or by default */}
            {isLocalSpeaker && (
              <div className={`speaker-bubble-card ${!webrtc.isMuted ? 'speaking' : ''}`}>
                <div className="speaker-avatar-halo-wrapper">
                  <div className="soundwave-ring soundwave-ring-1" />
                  <div className="soundwave-ring soundwave-ring-2" />
                  <div className="soundwave-ring soundwave-ring-3" />

                  <div
                    className="speaker-avatar-circle"
                    style={{ backgroundColor: user?.avatarColor || '#5865F2' }}
                  >
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>

                  <div className="speaker-mic-badge">
                    <Mic size={14} color="#57F287" />
                  </div>
                </div>

                <span className="speaker-name">{user?.username} (You)</span>
                <span className={`speaker-role-pill ${isServerOwner ? 'host' : ''}`}>
                  {isServerOwner ? 'Host' : 'Speaker'}
                </span>
              </div>
            )}

            {/* Remote Speakers */}
            {speakers.map((p) => {
              const isSpeaking = p.isSpeaking;
              return (
                <div
                  key={p.socketId}
                  className={`speaker-bubble-card ${isSpeaking ? 'speaking' : ''}`}
                >
                  <div className="speaker-avatar-halo-wrapper">
                    <div className="soundwave-ring soundwave-ring-1" />
                    <div className="soundwave-ring soundwave-ring-2" />
                    <div className="soundwave-ring soundwave-ring-3" />

                    <div
                      className="speaker-avatar-circle"
                      style={{ backgroundColor: p.avatarColor }}
                    >
                      {p.username.charAt(0).toUpperCase()}
                    </div>

                    <div className="speaker-mic-badge">
                      {p.isMuted ? (
                        <MicOff size={14} color="#da373c" />
                      ) : (
                        <Mic size={14} color="#57F287" />
                      )}
                    </div>
                  </div>

                  <span className="speaker-name">{p.username}</span>
                  <span className="speaker-role-pill">Speaker</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* LISTENERS SECTION */}
        <div>
          <div className="space-section-title">
            <Users size={16} color="var(--text-muted)" />
            <span>Listeners ({totalListeners})</span>
          </div>

          <div className="space-listeners-grid">
            {/* Local user if muted */}
            {!isLocalSpeaker && (
              <div className="listener-bubble-card">
                <div
                  className="listener-avatar-circle"
                  style={{ backgroundColor: user?.avatarColor || '#5865F2' }}
                >
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <span className="listener-name">{user?.username} (You)</span>
              </div>
            )}

            {/* Remote Listeners */}
            {listeners.map((p) => (
              <div key={p.socketId} className="listener-bubble-card">
                <div
                  className="listener-avatar-circle"
                  style={{ backgroundColor: p.avatarColor }}
                >
                  {p.username.charAt(0).toUpperCase()}
                </div>
                <span className="listener-name">{p.username}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Bottom Control Bar */}
      <div className="space-bottom-bar-wrapper">
        {/* Big Mic Toggle Button */}
        <button
          className={`space-mic-btn ${webrtc.isMuted ? 'muted' : ''}`}
          onClick={webrtc.toggleAudio}
          title={webrtc.isMuted ? 'Unmute Mic to Speak' : 'Mute Mic'}
        >
          {webrtc.isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

        {/* Reaction Buttons */}
        <div className="space-reactions-group">
          {['👏', '❤️', '🔥', '🚀', '💯', '🎉'].map((emoji) => (
            <button
              key={emoji}
              className="space-reaction-btn"
              onClick={() => sendReaction(emoji)}
              title={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Leave Space Button */}
        <button className="space-leave-btn" onClick={handleDisconnect}>
          <PhoneOff size={15} />
          Leave
        </button>
      </div>
    </div>
  );
};
