// In-memory store for active voice and video rooms
// roomId -> Map<socketId, { socketId, userId, username, avatarColor, isMuted, isVideoOff, isScreenSharing, isSpeaking }>
const voiceRooms = new Map();

// Helper to get all rooms and their participants
const getVoiceRoomsSummary = () => {
  const summary = {};
  for (const [roomId, participants] of voiceRooms.entries()) {
    summary[roomId] = Array.from(participants.values());
  }
  return summary;
};

const voiceVideoHandler = (io, socket) => {
  // Join a voice or video room
  socket.on('join_voice_room', ({ roomId, userState = {} }) => {
    if (!roomId) return;

    // Check if user was in another room, leave it first
    leaveCurrentVoiceRoom(socket, io);

    const roomKey = `voice:${roomId}`;
    socket.join(roomKey);
    socket.currentVoiceRoom = roomId;

    if (!voiceRooms.has(roomId)) {
      voiceRooms.set(roomId, new Map());
    }

    const roomParticipants = voiceRooms.get(roomId);

    const participantInfo = {
      socketId: socket.id,
      userId: socket.user?.id || userState.userId || socket.id,
      username: socket.user?.username || userState.username || 'Anonymous',
      avatarColor: socket.user?.avatarColor || userState.avatarColor || '#5865F2',
      isMuted: !!userState.isMuted,
      isVideoOff: userState.isVideoOff !== undefined ? userState.isVideoOff : true,
      isScreenSharing: !!userState.isScreenSharing,
      isSpeaking: false
    };

    // Send existing peers in the room to the newcomer
    const existingParticipants = Array.from(roomParticipants.values());
    socket.emit('existing_voice_participants', {
      roomId,
      participants: existingParticipants
    });

    // Add new participant to room
    roomParticipants.set(socket.id, participantInfo);

    // Broadcast new participant to others in room
    socket.to(roomKey).emit('user_joined_voice', {
      roomId,
      participant: participantInfo
    });

    // Broadcast room summary to everyone so server channel list shows who is in voice
    io.emit('voice_rooms_update', getVoiceRoomsSummary());

    console.log(`[Voice/Video] ${participantInfo.username} (${socket.id}) joined room ${roomId}. Room count: ${roomParticipants.size}`);
  });

  // WebRTC Signaling: Offer from one peer to another
  socket.on('voice_offer', ({ toSocketId, offer, roomId }) => {
    if (!toSocketId || !offer) return;
    const sender = voiceRooms.get(roomId)?.get(socket.id) || {
      socketId: socket.id,
      userId: socket.user?.id || socket.id,
      username: socket.user?.username || 'User',
      avatarColor: socket.user?.avatarColor || '#5865F2',
      isMuted: false,
      isVideoOff: true,
      isScreenSharing: false,
      isSpeaking: false
    };

    io.to(toSocketId).emit('voice_offer', {
      fromSocketId: socket.id,
      offer,
      roomId,
      user: sender
    });
  });

  // WebRTC Signaling: Answer back to the caller
  socket.on('voice_answer', ({ toSocketId, answer, roomId }) => {
    if (!toSocketId || !answer) return;
    io.to(toSocketId).emit('voice_answer', {
      fromSocketId: socket.id,
      answer,
      roomId
    });
  });

  // WebRTC Signaling: ICE Candidate exchange
  socket.on('ice_candidate', ({ toSocketId, candidate, roomId }) => {
    if (!toSocketId || !candidate) return;
    io.to(toSocketId).emit('ice_candidate', {
      fromSocketId: socket.id,
      candidate,
      roomId
    });
  });

  // Toggle Microphone Mute status
  socket.on('toggle_audio', ({ roomId, isMuted }) => {
    if (!roomId || !voiceRooms.has(roomId)) return;
    const participant = voiceRooms.get(roomId).get(socket.id);
    if (participant) {
      participant.isMuted = isMuted;
      io.to(`voice:${roomId}`).emit('user_toggled_audio', {
        socketId: socket.id,
        isMuted
      });
      io.emit('voice_rooms_update', getVoiceRoomsSummary());
    }
  });

  // Toggle Video Camera status
  socket.on('toggle_video', ({ roomId, isVideoOff }) => {
    if (!roomId || !voiceRooms.has(roomId)) return;
    const participant = voiceRooms.get(roomId).get(socket.id);
    if (participant) {
      participant.isVideoOff = isVideoOff;
      io.to(`voice:${roomId}`).emit('user_toggled_video', {
        socketId: socket.id,
        isVideoOff
      });
      io.emit('voice_rooms_update', getVoiceRoomsSummary());
    }
  });

  // Toggle Screen Sharing status
  socket.on('toggle_screen', ({ roomId, isScreenSharing }) => {
    if (!roomId || !voiceRooms.has(roomId)) return;
    const participant = voiceRooms.get(roomId).get(socket.id);
    if (participant) {
      participant.isScreenSharing = isScreenSharing;
      io.to(`voice:${roomId}`).emit('user_toggled_screen', {
        socketId: socket.id,
        isScreenSharing
      });
    }
  });

  // Speaking indicator (Audio level activity detected on client)
  socket.on('user_speaking', ({ roomId, isSpeaking }) => {
    if (!roomId || !voiceRooms.has(roomId)) return;
    const participant = voiceRooms.get(roomId).get(socket.id);
    if (participant) {
      participant.isSpeaking = isSpeaking;
      io.to(`voice:${roomId}`).emit('user_speaking_status', {
        socketId: socket.id,
        isSpeaking
      });
    }
  });

  // Twitter Space style live floating reactions
  socket.on('space_reaction', ({ roomId, emoji }) => {
    if (!roomId || !emoji) return;
    io.to(`voice:${roomId}`).emit('space_reaction', {
      socketId: socket.id,
      username: socket.user?.username || 'Guest',
      emoji,
      id: Math.random().toString(36).substring(2, 9)
    });
  });

  // Explicitly Leave Voice / Video Room
  socket.on('leave_voice_room', () => {
    leaveCurrentVoiceRoom(socket, io);
  });

  // Handle Disconnect
  socket.on('disconnect', () => {
    leaveCurrentVoiceRoom(socket, io);
  });
};

// Helper to leave current room
function leaveCurrentVoiceRoom(socket, io) {
  const roomId = socket.currentVoiceRoom;
  if (!roomId) return;

  const roomKey = `voice:${roomId}`;
  socket.leave(roomKey);
  socket.currentVoiceRoom = null;

  if (voiceRooms.has(roomId)) {
    const participants = voiceRooms.get(roomId);
    participants.delete(socket.id);

    // Notify other peers in room
    socket.to(roomKey).emit('user_left_voice', {
      roomId,
      socketId: socket.id
    });

    if (participants.size === 0) {
      voiceRooms.delete(roomId);
    }
  }

  // Broadcast updated room states
  io.emit('voice_rooms_update', getVoiceRoomsSummary());
  console.log(`[Voice/Video] Socket ${socket.id} left room ${roomId}`);
}

module.exports = { voiceVideoHandler, getVoiceRoomsSummary };
