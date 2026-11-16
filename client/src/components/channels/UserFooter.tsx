import React, { useState } from 'react';
import { Mic, MicOff, Headphones, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDiscord } from '../../context/DiscordContext';
import { Avatar } from '../ui/Avatar';
import { UserSettingsModal } from '../modals/UserSettingsModal';

export const UserFooter: React.FC = () => {
  const { user, logout } = useAuth();
  const { webrtc } = useDiscord();
  const [showSettings, setShowSettings] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);

  if (!user) return null;

  const toggleDeafen = () => {
    setIsDeafened(!isDeafened);
    // If deafened, also mute mic
    if (!isDeafened && !webrtc.isMuted) {
      webrtc.toggleAudio();
    }
  };

  return (
    <>
      <div className="user-footer">
        <div
          className="user-footer-profile"
          onClick={() => setShowSettings(true)}
          title="User Settings"
        >
          <Avatar
            username={user.username}
            color={user.avatarColor}
            size={32}
            status={user.status}
          />
          <div className="user-footer-info">
            <span className="user-footer-name">{user.username}</span>
            <span className="user-footer-status">
              {user.customStatus || user.status}
            </span>
          </div>
        </div>

        <div className="user-footer-actions">
          <button
            className={`user-footer-icon-btn ${webrtc.isMuted ? 'active-danger' : ''}`}
            onClick={webrtc.toggleAudio}
            title={webrtc.isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {webrtc.isMuted ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <button
            className={`user-footer-icon-btn ${isDeafened ? 'active-danger' : ''}`}
            onClick={toggleDeafen}
            title={isDeafened ? 'Undeafen' : 'Deafen'}
          >
            <Headphones size={18} />
          </button>

          <button
            className="user-footer-icon-btn"
            onClick={() => setShowSettings(true)}
            title="User Settings"
          >
            <Settings size={18} />
          </button>

          <button
            className="user-footer-icon-btn"
            onClick={logout}
            title="Log Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {showSettings && (
        <UserSettingsModal onClose={() => setShowSettings(false)} />
      )}
    </>
  );
};
