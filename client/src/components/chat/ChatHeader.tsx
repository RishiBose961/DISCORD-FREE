import React from 'react';
import { Hash, Volume2, Video, Users } from 'lucide-react';
import type { Channel } from '../../types';

interface ChatHeaderProps {
  channel: Channel;
  showMemberList: boolean;
  onToggleMemberList: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  channel,
  showMemberList,
  onToggleMemberList
}) => {
  const getIcon = () => {
    if (channel.type === 'voice') return <Volume2 size={24} color="#23a55a" />;
    if (channel.type === 'video') return <Video size={24} color="#5865F2" />;
    return <Hash size={24} color="#949ba4" />;
  };

  return (
    <div className="chat-header">
      <div className="chat-header-left">
        {getIcon()}
        <span className="chat-header-title">{channel.name}</span>
        {channel.topic && (
          <span className="chat-header-topic">{channel.topic}</span>
        )}
      </div>

      <div className="chat-header-right">
        <button
          className="user-footer-icon-btn"
          onClick={onToggleMemberList}
          title={showMemberList ? 'Hide Member List' : 'Show Member List'}
          style={{ color: showMemberList ? 'var(--text-header)' : 'var(--text-muted)' }}
        >
          <Users size={20} />
        </button>
      </div>
    </div>
  );
};
