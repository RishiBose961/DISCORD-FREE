import React, { useState } from 'react';
import { api } from '../../services/api';
import { useDiscord } from '../../context/DiscordContext';

interface CreateServerModalProps {
  onClose: () => void;
}

export const CreateServerModal: React.FC<CreateServerModalProps> = ({ onClose }) => {
  const { refreshServers, selectServer } = useDiscord();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const res = await api.servers.create({
        name: name.trim(),
        description: description.trim()
      });
      await refreshServers();
      if (res.server?._id) {
        await selectServer(res.server._id);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create server');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Customize Your Server</h2>
          <p className="modal-subtitle">
            Give your new server a personality with a name and an optional topic.
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
              <label className="form-label">Server Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="My Awesome Hangout"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="A server for games, chill, and chat"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
