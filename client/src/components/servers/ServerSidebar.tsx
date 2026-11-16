import React, { useState } from 'react';
import { Plus, Compass, MessageSquare } from 'lucide-react';
import { useDiscord } from '../../context/DiscordContext';
import { CreateServerModal } from './CreateServerModal';
import { JoinServerModal } from './JoinServerModal';

export const ServerSidebar: React.FC = () => {
  const { servers, activeServer, selectServer } = useDiscord();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  return (
    <>
      <div className="server-sidebar">
        {/* Discord Home Button */}
        <div className={`server-icon-wrapper ${!activeServer ? 'active' : ''}`}>
          <div className="server-pill" />
          <button
            className="server-icon-btn home-btn"
            title="Direct Messages / Home"
            onClick={() => {
              if (servers.length > 0) selectServer(servers[0]._id);
            }}
          >
            <MessageSquare size={24} />
          </button>
        </div>

        <div className="server-separator" />

        {/* Server List */}
        {servers.map((server) => {
          const isActive = activeServer?._id === server._id;
          return (
            <div
              key={server._id}
              className={`server-icon-wrapper ${isActive ? 'active' : ''}`}
            >
              <div className="server-pill" />
              <button
                className="server-icon-btn"
                style={{
                  backgroundColor: isActive ? server.iconColor : 'var(--bg-primary)'
                }}
                onClick={() => selectServer(server._id)}
                title={server.name}
              >
                {server.iconText || server.name.substring(0, 2).toUpperCase()}
              </button>
            </div>
          );
        })}

        {/* Add Server Button */}
        <div className="server-icon-wrapper">
          <button
            className="server-icon-btn add-btn"
            title="Add a Server"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={22} />
          </button>
        </div>

        {/* Explore / Join Server with Invite Button */}
        <div className="server-icon-wrapper">
          <button
            className="server-icon-btn"
            style={{ color: '#23a55a' }}
            title="Join Server with Invite Code"
            onClick={() => setShowJoinModal(true)}
          >
            <Compass size={22} />
          </button>
        </div>
      </div>

      {showCreateModal && (
        <CreateServerModal onClose={() => setShowCreateModal(false)} />
      )}
      {showJoinModal && (
        <JoinServerModal onClose={() => setShowJoinModal(false)} />
      )}
    </>
  );
};
