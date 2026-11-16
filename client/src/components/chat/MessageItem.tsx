import React from 'react';
import type { Message } from '../../types';
import { Avatar } from '../ui/Avatar';

interface MessageItemProps {
  message: Message;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const senderName = message.sender?.username || 'Unknown User';
  const senderColor = message.sender?.avatarColor || '#5865F2';

  return (
    <div className="message-item">
      <Avatar
        username={senderName}
        color={senderColor}
        size={40}
        fontSize={16}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="message-item-header">
          <span className="message-author">{senderName}</span>
          <span className="message-timestamp">
            {formatTime(message.createdAt)}
          </span>
        </div>
        <div className="message-content">{message.content}</div>
      </div>
    </div>
  );
};
