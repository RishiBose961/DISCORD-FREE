import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { DiscordProvider, useDiscord } from './context/DiscordContext';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { ServerSidebar } from './components/servers/ServerSidebar';
import { ChannelSidebar } from './components/channels/ChannelSidebar';
import { ChatArea } from './components/chat/ChatArea';
import { VoiceVideoRoom } from './components/voice/VoiceVideoRoom';
import { MemberSidebar } from './components/members/MemberSidebar';

function DiscordDashboard() {
  const { activeChannel } = useDiscord();
  const [showMemberList, setShowMemberList] = useState(true);

  const isVoiceOrVideo = activeChannel?.type === 'voice' || activeChannel?.type === 'video';

  return (
    <div className="app-container">
      {/* 1. Leftmost Server Sidebar */}
      <ServerSidebar />

      {/* 2. Channel Sidebar */}
      <ChannelSidebar />

      {/* 3. Main Center Area: Text Chat or Voice/Video Call Room */}
      {isVoiceOrVideo && activeChannel ? (
        <VoiceVideoRoom channel={activeChannel} />
      ) : (
        <ChatArea
          showMemberList={showMemberList}
          onToggleMemberList={() => setShowMemberList(!showMemberList)}
        />
      )}

      {/* 4. Right Members List */}
      {showMemberList && !isVoiceOrVideo && <MemberSidebar />}
    </div>
  );
}

function MainContent() {
  const { user, isLoading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  if (isLoading) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1e1f22',
          color: '#f2f3f5',
          fontFamily: 'inherit'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#5865F2' }}>
            DiscordX
          </div>
          <div style={{ color: '#949ba4', fontSize: 14 }}>Connecting to DiscordX network...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return authView === 'login' ? (
      <Login onSwitchToRegister={() => setAuthView('register')} />
    ) : (
      <Register onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  return (
    <SocketProvider>
      <DiscordProvider>
        <DiscordDashboard />
      </DiscordProvider>
    </SocketProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
