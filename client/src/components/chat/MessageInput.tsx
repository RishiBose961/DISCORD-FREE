import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile } from 'lucide-react';
import type { Channel } from '../../types';

interface MessageInputProps {
  channel: Channel;
  onSendMessage: (content: string) => Promise<void>;
  onTyping: () => void;
  onStopTyping: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  channel,
  onSendMessage,
  onTyping,
  onStopTyping
}) => {
  const [content, setContent] = useState('');
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);
    onTyping();

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      onStopTyping();
    }, 2000);
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!content.trim()) return;

      const msg = content.trim();
      setContent('');
      onStopTyping();

      try {
        await onSendMessage(msg);
      } catch (err) {
        console.error('Failed to send message:', err);
      }
    }
  };

  const handleSendClick = async () => {
    if (!content.trim()) return;
    const msg = content.trim();
    setContent('');
    onStopTyping();
    try {
      await onSendMessage(msg);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="chat-input-container">
      <div className="chat-input-wrapper">
        <input
          type="text"
          className="chat-input"
          placeholder={`Message #${channel.name}`}
          value={content}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
        />

        <button
          className="chat-input-btn"
          title="Add Emoji"
          type="button"
          onClick={() => setContent((prev) => prev + ' 👋')}
        >
          <Smile size={20} />
        </button>

        <button
          className="chat-input-btn"
          title="Send Message"
          type="button"
          onClick={handleSendClick}
          style={{ color: content.trim() ? 'var(--brand)' : 'var(--text-muted)' }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};
