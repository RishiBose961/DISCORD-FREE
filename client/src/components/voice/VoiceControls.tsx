import React from 'react';
import { Mic, MicOff, Video, VideoOff, Monitor, PhoneOff } from 'lucide-react';

interface VoiceControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onDisconnect: () => void;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  isMuted,
  isVideoOff,
  isScreenSharing,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onDisconnect
}) => {
  return (
    <div className="voice-controls-bar">
      {/* Microphone toggle */}
      <button
        className={`control-btn ${isMuted ? 'active-off' : ''}`}
        onClick={onToggleAudio}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
      </button>

      {/* Video camera toggle */}
      <button
        className={`control-btn ${isVideoOff ? 'active-off' : ''}`}
        onClick={onToggleVideo}
        title={isVideoOff ? 'Turn on Camera' : 'Turn off Camera'}
      >
        {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
      </button>

      {/* Screen share toggle */}
      <button
        className={`control-btn ${isScreenSharing ? 'screen-active' : ''}`}
        onClick={onToggleScreenShare}
        title={isScreenSharing ? 'Stop Sharing' : 'Share Your Screen'}
      >
        <Monitor size={22} />
      </button>

      {/* Disconnect button */}
      <button
        className="control-btn disconnect-btn"
        onClick={onDisconnect}
        title="Disconnect / Leave Room"
      >
        <PhoneOff size={24} />
      </button>
    </div>
  );
};
