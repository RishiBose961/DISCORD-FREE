import React, { useState } from 'react';
import { Hash, Volume2, Video } from 'lucide-react';
import { api } from '../../services/api';
import { useDiscord } from '../../context/DiscordContext';

interface CreateChannelModalProps {
  onClose: () => void;
  defaultType?: 'text' | 'voice' | 'video';
}

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({
  onClose,
  defaultType = 'text'
}) => {
  const { activeServer, refreshChannels, selectChannel } = useDiscord();
  const [type, setType] = useState<'text' | 'voice' | 'video'>(defaultType);
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !activeServer) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const res = await api.channels.create({
        serverId: activeServer._id,
        name: name.trim(),
        type,
        topic: topic.trim()
      });
      await refreshChannels();
      if (res.channel) {
        selectChannel(res.channel);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create channel');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create Channel</h2>
          <p className="modal-subtitle">in {activeServer?.name}</p>
        </div>

        {error && (
          <div style={{ padding: '0 24px' }}>
            <div className="auth-error">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Channel Type</label>
              <div className="channel-type-selector">
                <div
                  className={`channel-type-option ${type === 'text' ? 'selected' : ''}`}
                  onClick={() => setType('text')}
                >
                  <Hash size={24} color="#949ba4" />
                  <div>
                    <div style={{ fontWeight: 600, color: '#f2f3f5' }}>Text</div>
                    <div style={{ fontSize: 12, color: '#949ba4' }}>
                      Post messages, links, and talk with text
                    </div>
                  </div>
                </div>

                <div
                  className={`channel-type-option ${type === 'voice' ? 'selected' : ''}`}
                  onClick={() => setType('voice')}
                >
                  <Volume2 size={24} color="#eb459e" />
                  <div>
                    <div style={{ fontWeight: 600, color: '#f2f3f5' }}>Voice Space</div>
                    <div style={{ fontSize: 12, color: '#949ba4' }}>
                      Twitter Space style audio stage (soundwave ripples, reactions, no video)
                    </div>
                  </div>
                </div>

                <div
                  className={`channel-type-option ${type === 'video' ? 'selected' : ''}`}
                  onClick={() => setType('video')}
                >
                  <Video size={24} color="#5865F2" />
                  <div>
                    <div style={{ fontWeight: 600, color: '#f2f3f5' }}>Video & Screen Share</div>
                    <div style={{ fontSize: 12, color: '#949ba4' }}>
                      Face-to-face video grid and screen sharing room
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Channel Name</label>
              <input
                type="text"
                className="form-input"
                placeholder={type === 'text' ? 'new-channel' : 'Voice Lounge'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Channel Topic (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="What is this channel about?"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
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
              {isSubmitting ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
