import React, { useEffect, useRef } from 'react';
import { Hash } from 'lucide-react';
import type { Message, Channel } from '../../types';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages: Message[];
  channel: Channel;
  isLoading: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, channel, isLoading }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="messages-container">
      {/* Discord Welcome Box */}
      <div className="messages-welcome-box">
        <div className="messages-welcome-icon">
          <Hash size={40} />
        </div>
        <h2 className="messages-welcome-title">Welcome to #{channel.name}!</h2>
        <p className="messages-welcome-subtitle">
          {channel.topic
            ? channel.topic
            : `This is the start of the #${channel.name} channel.`}
        </p>
      </div>

      {isLoading && (
        <div style={{ color: 'var(--text-muted)', padding: '16px 0', fontSize: 13 }}>
          Loading messages...
        </div>
      )}

      {/* Message Items */}
      {messages.map((msg) => (
        <MessageItem key={msg._id} message={msg} />
      ))}

      <div ref={bottomRef} style={{ height: 16 }} />
    </div>
  );
};
