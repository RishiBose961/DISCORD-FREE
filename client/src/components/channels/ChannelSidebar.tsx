import React, { useState } from 'react';
import { Plus, ChevronDown, Copy, Check, Wifi, PhoneOff } from 'lucide-react';
import { useDiscord } from '../../context/DiscordContext';
import { ChannelItem } from './ChannelItem';
import { UserFooter } from './UserFooter';
import { CreateChannelModal } from './CreateChannelModal';

export const ChannelSidebar: React.FC = () => {
  const { activeServer, channels, webrtc, selectChannel } = useDiscord();
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [createType, setCreateType] = useState<'text' | 'voice' | 'video'>('text');
  const [copiedInvite, setCopiedInvite] = useState(false);

  if (!activeServer) {
    return (
      <div className="channel-sidebar" style={{ justifyContent: 'space-between' }}>
        <div style={{ padding: '20px', color: 'var(--text-muted)', fontSize: '14px' }}>
          No server selected. Select or create one from the left sidebar.
        </div>
        <UserFooter />
      </div>
    );
  }

  const textChannels = channels.filter((c) => c.type === 'text');
  const voiceVideoChannels = channels.filter((c) => c.type === 'voice' || c.type === 'video');
  const connectedVoiceChannel = channels.find((c) => c._id === webrtc.currentRoomId);

  const copyInvite = () => {
    if (activeServer.inviteCode) {
      navigator.clipboard.writeText(activeServer.inviteCode);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
    }
  };

  return (
    <>
      <div className="channel-sidebar">
        {/* Server Header */}
        <div className="server-header" onClick={copyInvite} title="Click to copy Invite Code">
          <span className="server-title">{activeServer.name}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {activeServer.inviteCode && (
              <span
                style={{
                  fontSize: 11,
                  background: 'rgba(255,255,255,0.08)',
                  padding: '2px 6px',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                {copiedInvite ? <Check size={12} color="#23a55a" /> : <Copy size={12} />}
                {activeServer.inviteCode}
              </span>
            )}
            <ChevronDown size={18} color="var(--text-muted)" />
          </div>
        </div>

        {/* Channels List */}
        <div className="channel-list-container">
          {/* Text Channels */}
          <div className="channel-category-header">
            <span>Text Channels</span>
            <button
              className="add-channel-icon-btn"
              onClick={() => {
                setCreateType('text');
                setShowCreateChannel(true);
              }}
              title="Create Text Channel"
            >
              <Plus size={16} />
            </button>
          </div>
          {textChannels.map((channel) => (
            <ChannelItem key={channel._id} channel={channel} />
          ))}

          {/* Voice & Video Channels */}
          <div className="channel-category-header" style={{ marginTop: 16 }}>
            <span>Voice & Video Rooms</span>
            <button
              className="add-channel-icon-btn"
              onClick={() => {
                setCreateType('voice');
                setShowCreateChannel(true);
              }}
              title="Create Voice/Video Room"
            >
              <Plus size={16} />
            </button>
          </div>
          {voiceVideoChannels.map((channel) => (
            <ChannelItem key={channel._id} channel={channel} />
          ))}
        </div>

        {/* Discord-style Persistent Active Voice Connected Status Panel */}
        {connectedVoiceChannel && (
          <div
            style={{
              backgroundColor: '#111214',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              borderBottom: '1px solid rgba(0,0,0,0.2)',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
            onClick={() => selectChannel(connectedVoiceChannel)}
            title="Click to view Voice Room"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#23a55a' }}>
                <Wifi size={14} />
                <span>Voice Connected</span>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {connectedVoiceChannel.name} / {activeServer.name}
              </span>
            </div>

            <button
              className="user-footer-icon-btn"
              style={{ color: '#f23f43', width: 28, height: 28 }}
              onClick={(e) => {
                e.stopPropagation();
                webrtc.leaveVoiceRoom();
              }}
              title="Disconnect from Voice"
            >
              <PhoneOff size={16} />
            </button>
          </div>
        )}

        {/* User Footer at Bottom */}
        <UserFooter />
      </div>

      {showCreateChannel && (
        <CreateChannelModal
          defaultType={createType}
          onClose={() => setShowCreateChannel(false)}
        />
      )}
    </>
  );
};
