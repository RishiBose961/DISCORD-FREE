import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Avatar } from '../ui/Avatar';

const AVATAR_PALETTE = [
  '#5865F2', // Blurple
  '#57F287', // Green
  '#FEE75C', // Yellow
  '#EB459E', // Fuchsia
  '#ED4245', // Red
  '#3BA55C', // Emerald
  '#FAA61A', // Orange
  '#9B59B6', // Purple
  '#1ABC9C'  // Teal
];

interface UserSettingsModalProps {
  onClose: () => void;
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({ onClose }) => {
  const { user, updateUser, logout } = useAuth();
  const [status, setStatus] = useState(user?.status || 'online');
  const [customStatus, setCustomStatus] = useState(user?.customStatus || '');
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor || '#5865F2');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setMessage(null);
      await api.users.updateProfile({
        status,
        customStatus,
        avatarColor
      });
      updateUser({ status, customStatus, avatarColor });
      setMessage('Profile updated successfully!');
      setTimeout(() => {
        onClose();
      }, 800);
    } catch {
      setMessage('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">My Account & Profile</h2>
          <p className="modal-subtitle">Customize how you appear across DiscordX</p>
        </div>

        {message && (
          <div style={{ padding: '0 24px' }}>
            <div
              style={{
                backgroundColor: 'rgba(35, 165, 90, 0.2)',
                color: '#57f287',
                padding: '8px 12px',
                borderRadius: 4,
                fontSize: 13,
                textAlign: 'center'
              }}
            >
              {message}
            </div>
          </div>
        )}

        <form onSubmit={handleSave}>
          <div className="modal-body">
            {/* Avatar Preview */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Avatar
                username={user?.username}
                color={avatarColor}
                size={64}
                fontSize={26}
                status={status}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: 18, color: '#f2f3f5' }}>
                  {user?.username}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  {user?.email}
                </div>
              </div>
            </div>

            {/* Avatar Color Picker */}
            <div className="form-group">
              <label className="form-label">Avatar Color Theme</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {AVATAR_PALETTE.map((color) => (
                  <div
                    key={color}
                    onClick={() => setAvatarColor(color)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: color,
                      cursor: 'pointer',
                      border: avatarColor === color ? '3px solid #ffffff' : '2px solid transparent',
                      boxShadow: avatarColor === color ? '0 0 8px rgba(255,255,255,0.4)' : 'none'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Online Status */}
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-input"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'online' | 'idle' | 'dnd' | 'offline')}
              >
                <option value="online">🟢 Online</option>
                <option value="idle">🟡 Idle</option>
                <option value="dnd">🔴 Do Not Disturb</option>
                <option value="offline">⚪ Invisible / Offline</option>
              </select>
            </div>

            {/* Custom Status */}
            <div className="form-group">
              <label className="form-label">Custom Status Message</label>
              <input
                type="text"
                className="form-input"
                placeholder="What's on your mind? (e.g. Coding WebRTC...)"
                value={customStatus}
                onChange={(e) => setCustomStatus(e.target.value)}
                maxLength={100}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                onClose();
                logout();
              }}
            >
              Log Out
            </button>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
