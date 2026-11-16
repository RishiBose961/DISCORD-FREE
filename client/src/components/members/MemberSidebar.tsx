import React from 'react';
import { Crown } from 'lucide-react';
import { useDiscord } from '../../context/DiscordContext';
import { useSocket } from '../../context/SocketContext';
import { Avatar } from '../ui/Avatar';

export const MemberSidebar: React.FC = () => {
  const { activeServer } = useDiscord();
  const { onlineUsers } = useSocket();

  if (!activeServer || !activeServer.members) return null;

  const members = activeServer.members.map((m) => m.user).filter(Boolean);

  const onlineMembers = members.filter((m) => onlineUsers.has(m.id || (m as unknown as { _id: string })._id));
  const offlineMembers = members.filter((m) => !onlineUsers.has(m.id || (m as unknown as { _id: string })._id));

  const ownerId = typeof activeServer.owner === 'object' ? activeServer.owner?.id : activeServer.owner;

  return (
    <div className="members-sidebar">
      {/* Online Section */}
      <div className="members-group-title">
        Online — {onlineMembers.length}
      </div>
      {onlineMembers.map((member) => {
        const mId = member.id || (member as unknown as { _id: string })._id;
        const isOwner = mId === ownerId;

        return (
          <div key={mId} className="member-item">
            <Avatar
              username={member.username}
              color={member.avatarColor}
              size={32}
              status="online"
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="member-name">{member.username}</span>
                {isOwner && <Crown size={14} color="#f0b232" />}
              </div>
              {member.customStatus && (
                <div className="member-status-text">{member.customStatus}</div>
              )}
            </div>
          </div>
        );
      })}

      {/* Offline Section */}
      {offlineMembers.length > 0 && (
        <>
          <div className="members-group-title" style={{ marginTop: 16 }}>
            Offline — {offlineMembers.length}
          </div>
          {offlineMembers.map((member) => {
            const mId = member.id || (member as unknown as { _id: string })._id;
            const isOwner = mId === ownerId;

            return (
              <div key={mId} className="member-item" style={{ opacity: 0.7 }}>
                <Avatar
                  username={member.username}
                  color={member.avatarColor}
                  size={32}
                  status="offline"
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="member-name">{member.username}</span>
                    {isOwner && <Crown size={14} color="#f0b232" />}
                  </div>
                  {member.customStatus && (
                    <div className="member-status-text">{member.customStatus}</div>
                  )}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};
