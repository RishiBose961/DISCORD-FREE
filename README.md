# DiscordX 🚀

A modern full-stack Discord clone featuring **Real-time Chat, Server & Channel Rooms, Voice Talk, and WebRTC Video Calling & Screen Sharing**. Built with a clean micro-service architecture featuring an **independent Socket.io & WebRTC signaling server** outside the main REST API.

---

## 🌟 Key Features

1. **Discord-like UI & Dark Mode**:
   - Leftmost server sidebar with active indicators and custom icons.
   - Middle channel sidebar with Text Channels (`#`) and Voice/Video Channels (`🔊`, `🎥`).
   - Server creation and invitation system (instant join via invite code).
   - Bottom user profile bar with microphone mute/unmute, deafen, and account customization.
   - Online / Offline members list grouped by status with owner crowns.
   - Color/initial-based avatar system (no file/image upload required).

2. **Real-time Chat**:
   - Text channels with message history persistence in **MongoDB** via **Mongoose**.
   - Real-time instant messaging powered by the independent socket server.
   - Live "User is typing..." indicators.
   - Discord-style timestamping and message grouping.

3. **Voice Rooms (Twitter Spaces Style Live Audio)**:
   - Dedicated **Twitter Spaces / Clubhouse style stage** for all Voice Rooms.
   - **No video tiles or screen share boxes** cluttering voice rooms: pure focus on talk and audio.
   - **Speakers vs. Listeners Stages**: Concentric pulsating soundwave rings around active speaker avatars when talking.
   - **Floating Live Reactions**: Instant live reaction animations (👏, ❤️, 🔥, 🚀, 💯, 🎉) that float up on the screen in real-time.
   - Quick one-click mute/unmute and room controls.

4. **Video Call & Screen Sharing Rooms**:
   - Dedicated Video channels (`🎥 Video Lounge`) with multi-person video grid and screen sharing.
   - Webcam toggle on / off.
   - Screen sharing support (`getDisplayMedia`) with stream replacement.
   - Audio and video mesh WebRTC connection.

5. **Independent Socket & Signaling Server**:
   - Runs in a separate folder (`socket-server`) on its own independent port (`5001`).
   - Completely decoupled from the REST API server (`5000`).
   - Handles real-time chat broadcast, presence, and WebRTC SDP offers, answers, and ICE candidate exchange.

---

## 📂 Project Structure

```
d:\discordx\
├── server\                     # Main REST API Server (Node.js, Express, Mongoose, MongoDB)
│   ├── config\
│   │   └── db.js               # MongoDB connection with Mongoose
│   ├── models\
│   │   ├── User.js             # User schema (auth, status, avatarColor, servers)
│   │   ├── Server.js           # Server schema (channels, members, owner, invite code)
│   │   ├── Channel.js          # Channel schema (text, voice, video)
│   │   └── Message.js          # Message schema (channelId, sender, content)
│   ├── controllers\
│   │   ├── authController.js   # Register, Login, Me (auto-creates starter server)
│   │   ├── serverController.js # CRUD for servers & invites
│   │   ├── channelController.js# CRUD for text, voice, video channels
│   │   ├── messageController.js# Message queries & creation
│   │   └── userController.js   # Profile & presence updates
│   ├── middleware\
│   │   ├── authMiddleware.js   # JWT authentication
│   │   └── errorMiddleware.js  # Global error handling
│   ├── routes\
│   │   ├── authRoutes.js       # /api/auth
│   │   ├── serverRoutes.js     # /api/servers
│   │   ├── channelRoutes.js    # /api/channels
│   │   ├── messageRoutes.js    # /api/messages
│   │   └── userRoutes.js       # /api/users
│   ├── .env                    # Environment variables (PORT=5000, MONGODB_URI, JWT_SECRET)
│   ├── package.json
│   └── index.js                # Express entry point
│
├── socket-server\              # Independent Real-Time & WebRTC Signaling Server
│   ├── config\
│   │   └── socketConfig.js     # CORS & STUN ICE servers configuration
│   ├── middleware\
│   │   └── socketAuth.js       # Socket JWT authentication & guest fallback
│   ├── handlers\
│   │   ├── chatHandler.js      # Join channel, send message, typing broadcast
│   │   ├── voiceVideoHandler.js# WebRTC signaling (mesh audio/video, ICE, mute/video/speaking)
│   │   └── userStatusHandler.js# Online presence & status sync
│   ├── .env                    # Environment variables (PORT=5001, CLIENT_URL, JWT_SECRET)
│   ├── package.json
│   └── index.js                # Standalone Socket.io server
│
├── client\                     # Modern React + TypeScript + Vite Frontend
│   ├── src\
│   │   ├── components\
│   │   │   ├── auth\           # Login & Register views
│   │   │   ├── servers\        # ServerSidebar, CreateServerModal, JoinServerModal
│   │   │   ├── channels\       # ChannelSidebar, ChannelItem, CreateChannelModal, UserFooter
│   │   │   ├── chat\           # ChatArea, ChatHeader, MessageList, MessageItem, MessageInput
│   │   │   ├── voice\          # VoiceVideoRoom, VideoTile, VoiceControls
│   │   │   ├── members\        # MemberSidebar (Online/Offline list)
│   │   │   ├── modals\         # UserSettingsModal (status & avatar color picker)
│   │   │   └── ui\             # Avatar with live status dot
│   │   ├── context\
│   │   │   ├── AuthContext.tsx # Authentication state
│   │   │   ├── SocketContext.tsx# Standalone Socket.io connection & presence
│   │   │   └── DiscordContext.tsx# Server, channel, message, and WebRTC coordination
│   │   ├── hooks\
│   │   │   └── useWebRTC.ts    # Native WebRTC mesh hook with audio analyser & screen sharing
│   │   ├── services\
│   │   │   ├── api.ts          # Fetch wrapper for REST API
│   │   │   └── socket.ts       # Socket client singleton
│   │   ├── types\
│   │   │   └── index.ts        # TypeScript interfaces
│   │   ├── App.tsx             # Root Discord app layout
│   │   ├── index.css           # Authentic Discord dark theme styles
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── data\                       # Local MongoDB data directory
├── start-mongo.bat             # Helper script to launch local MongoDB
├── start-dev.js                # Unified orchestrator to run API, Socket, and Client
├── package.json                # Root package with unified npm scripts
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Start MongoDB
Ensure MongoDB is running locally on port 27017 or provide your MongoDB Atlas connection string in `server/.env`.
If using local MongoDB on Windows:
```bash
# Double-click start-mongo.bat or run:
.\start-mongo.bat
```

### 2. Run All Services Together
From the root directory:
```bash
npm run dev
# or
node start-dev.js
```

This starts:
- **API Server** on [http://localhost:5000](http://localhost:5000)
- **Independent Socket Server** on [http://localhost:5001](http://localhost:5001)
- **Web Client** on [http://localhost:5173](http://localhost:5173)

---

## 🛠️ Running Services Individually

If you prefer to run each service in its own terminal tab:

### Terminal 1: REST API Server
```bash
cd server
npm run dev
```

### Terminal 2: Independent Socket & WebRTC Server
```bash
cd socket-server
npm run dev
```

### Terminal 3: Client
```bash
cd client
bun run dev  # or npm run dev
```

---

## 📱 Testing Multi-User Voice & Video Call

1. Open `http://localhost:5173` in your browser.
2. Register a new user (e.g. `User1`). A default starter server **General Community** will be automatically created with `#general`, `#dev-talk`, `🔊 General Voice`, and `🎥 Video Lounge`.
3. Open an Incognito window or another browser and register a second user (e.g. `User2`).
4. Copy the 6-character Invite Code displayed at the top of the server channel list and join the server from the second user.
5. Click on `🔊 General Voice` or `🎥 Video Lounge` in both windows. Allow microphone and camera access.
6. You will see both participants connected in the video grid, with real-time peer-to-peer audio/video stream and active speaking green border indicators!
#   D I S C O R D - F R E E  
 