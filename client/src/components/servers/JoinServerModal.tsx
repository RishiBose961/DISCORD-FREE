import React, { useState } from 'react';
import { api } from '../../services/api';
import { useDiscord } from '../../context/DiscordContext';

interface JoinServerModalProps {
  onClose: () => void;
}

export const JoinServerModal: React.FC<JoinServerModalProps> = ({ onClose }) => {
  const { refreshServers, selectServer } = useDiscord();
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const res = await api.servers.join(inviteCode.trim());
      await refreshServers();
      if (res.server?._id) {
        await selectServer(res.server._id);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid invite code');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Join a Server</h2>
          <p className="modal-subtitle">
            Enter an invite code below to join an existing server.
          </p>
        </div>

        {error && (
          <div style={{ padding: '0 24px' }}>
            <div className="auth-error">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Invite Code</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. A1B2C3"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                autoFocus
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || !inviteCode.trim()}
            >
              {isSubmitting ? 'Joining...' : 'Join Server'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
