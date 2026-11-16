import React, { useRef, useEffect } from 'react';
import { Mic, MicOff, Monitor } from 'lucide-react';

interface VideoTileProps {
  stream?: MediaStream | null;
  username: string;
  avatarColor: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing?: boolean;
  isSpeaking: boolean;
  isLocal?: boolean;
}

export const VideoTile: React.FC<VideoTileProps> = ({
  stream,
  username,
  avatarColor,
  isMuted,
  isVideoOff,
  isScreenSharing = false,
  isSpeaking,
  isLocal = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Bind video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, isVideoOff]);

  // Bind audio element for remote stream (ensures voice is always heard even if camera is off!)
  useEffect(() => {
    if (!isLocal && audioRef.current && stream) {
      audioRef.current.srcObject = stream;
      audioRef.current.play().catch((e) => {
        console.warn('[VideoTile] Remote audio autoplay error:', e);
      });
    }
  }, [stream, isLocal]);

  // Check if stream actually has enabled video tracks
  const hasVideoTrack = stream && stream.getVideoTracks().length > 0 && !isVideoOff;

  return (
    <div className={`video-tile ${isSpeaking ? 'speaking' : ''}`}>
      {/* Remote Audio Playback (always rendered for remote streams so voice audio works!) */}
      {!isLocal && (
        <audio
          ref={audioRef}
          autoPlay
          playsInline
          style={{ display: 'none' }}
        />
      )}

      {hasVideoTrack ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal} // Avoid local feedback echo
          className="video-element"
        />
      ) : (
        <div className="video-avatar-fallback">
          <div
            className="video-avatar-circle"
            style={{ backgroundColor: avatarColor }}
          >
            {username.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {/* Participant Name Tag */}
      <div className="video-tile-tag">
        {isMuted ? (
          <MicOff size={14} color="#f23f43" />
        ) : (
          <Mic size={14} color={isSpeaking ? '#23a55a' : '#fff'} />
        )}
        <span>{username} {isLocal && '(You)'}</span>
      </div>

      {/* Status Badges */}
      <div className="video-tile-icons">
        {isScreenSharing && (
          <div className="video-badge" title="Sharing Screen">
            <Monitor size={14} color="#23a55a" />
          </div>
        )}
        {isMuted && (
          <div className="video-badge" style={{ backgroundColor: 'rgba(242, 63, 67, 0.8)' }}>
            <MicOff size={14} />
          </div>
        )}
      </div>
    </div>
  );
};
