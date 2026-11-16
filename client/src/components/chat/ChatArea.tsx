import React from 'react';
import { useDiscord } from '../../context/DiscordContext';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

interface ChatAreaProps {
  showMemberList: boolean;
  onToggleMemberList: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  showMemberList,
  onToggleMemberList
}) => {
  const {
    activeChannel,
    messages,
    isLoadingMessages,
    typingUsers,
    sendMessage,
    sendTyping,
    sendStopTyping
  } = useDiscord();

  if (!activeChannel) {
    return (
      <div className="main-chat-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Select a channel to start chatting</p>
      </div>
    );
  }

  const typingText =
    typingUsers.length === 1
      ? `${typingUsers[0]} is typing...`
      : typingUsers.length > 1
      ? `${typingUsers.slice(0, 3).join(', ')} are typing...`
      : null;

  return (
    <div className="main-chat-container">
      <ChatHeader
        channel={activeChannel}
        showMemberList={showMemberList}
        onToggleMemberList={onToggleMemberList}
      />

      <MessageList
        messages={messages}
        channel={activeChannel}
        isLoading={isLoadingMessages}
      />

      <div style={{ position: 'relative' }}>
        {typingText && <div className="typing-indicator">{typingText}</div>}
        <MessageInput
          channel={activeChannel}
          onSendMessage={sendMessage}
          onTyping={sendTyping}
          onStopTyping={sendStopTyping}
        />
      </div>
    </div>
  );
};
