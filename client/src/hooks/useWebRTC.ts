import { useState, useRef, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import type { VoiceParticipant, User } from '../types';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' }
  ]
};

export const useWebRTC = (socket: Socket | null, currentUser: User | null) => {
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState<Map<string, VoiceParticipant>>(new Map());
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [connectionNotice, setConnectionNotice] = useState<string | null>(null);

  // References for WebRTC peer connections and media streams
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Clean up all peer connections
  const closeAllPeerConnections = useCallback(() => {
    peerConnections.current.forEach((pc) => {
      try {
        pc.close();
      } catch {}
    });
    peerConnections.current.clear();
    pendingCandidates.current.clear();
  }, []);

  // Stop local media tracks
  const stopLocalTracks = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }, []);

  // Process queued ICE candidates
  const drainPendingCandidates = useCallback(async (socketId: string, pc: RTCPeerConnection) => {
    const queue = pendingCandidates.current.get(socketId);
    if (queue && queue.length > 0) {
      for (const candidate of queue) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('[WebRTC] Error draining ICE candidate:', e);
        }
      }
      pendingCandidates.current.delete(socketId);
    }
  }, []);

  // Speaking indicator audio detection
  const setupAudioDetection = useCallback((stream: MediaStream, roomId: string) => {
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const microphone = audioCtx.createMediaStreamSource(stream);
      microphone.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let wasSpeaking = false;

      const checkVolume = () => {
        if (!analyserRef.current || !socket) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const isSpeaking = average > 16;

        if (isSpeaking !== wasSpeaking) {
          wasSpeaking = isSpeaking;
          socket.emit('user_speaking', { roomId, isSpeaking });
        }

        animationFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      console.warn('[WebRTC Audio Detection] AudioContext setup skipped:', e);
    }
  }, [socket]);

  // Create a PeerConnection for a specific remote socket
  const createPeerConnection = useCallback((toSocketId: string, roomId: string): RTCPeerConnection => {
    if (peerConnections.current.has(toSocketId)) {
      try {
        peerConnections.current.get(toSocketId)?.close();
      } catch {}
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnections.current.set(toSocketId, pc);

    // Add local tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          pc.addTrack(track, localStreamRef.current!);
        } catch (e) {
          console.warn('[WebRTC] addTrack warning:', e);
        }
      });
    }

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice_candidate', {
          toSocketId,
          candidate: event.candidate,
          roomId
        });
      }
    };

    // Remote track handler (receives remote audio/video)
    pc.ontrack = (event) => {
      console.log(`[WebRTC] Received remote track (${event.track.kind}) from ${toSocketId}`);
      const remoteStream = event.streams[0] || new MediaStream([event.track]);

      setParticipants((prev) => {
        const next = new Map(prev);
        const participant = next.get(toSocketId);
        if (participant) {
          next.set(toSocketId, {
            ...participant,
            stream: remoteStream
          });
        }
        return next;
      });
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection with ${toSocketId}: ${pc.connectionState}`);
      if (pc.connectionState === 'connected') {
        setConnectionState('connected');
      }
    };

    return pc;
  }, [socket]);

  // Join a voice or video channel
  const joinVoiceRoom = useCallback(async (roomId: string, initialVideoOff = true) => {
    if (!socket) {
      alert('Connecting to socket server, please try again in a moment.');
      return;
    }

    setConnectionState('connecting');
    setConnectionNotice(null);

    // Clean up existing room connection
    stopLocalTracks();
    closeAllPeerConnections();
    setParticipants(new Map());

    let acquiredStream: MediaStream | null = null;
    let actualVideoOff = initialVideoOff;
    let actualMuted = false;

    // Resilient media acquisition with fallbacks
    try {
      if (!initialVideoOff) {
        try {
          // Attempt Video + Audio
          acquiredStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: { width: { ideal: 1280 }, height: { ideal: 720 } }
          });
          actualVideoOff = false;
        } catch (videoErr) {
          console.warn('[WebRTC] Camera unavailable, trying audio-only:', videoErr);
          // Fallback to audio only
          acquiredStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          actualVideoOff = true;
          setConnectionNotice('Camera not found or blocked. Connected in audio-only mode.');
        }
      } else {
        // Voice only mode
        acquiredStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        actualVideoOff = true;
      }
    } catch (audioErr) {
      console.warn('[WebRTC] Microphone unavailable, joining as listener:', audioErr);
      // Fallback: create empty media stream so user can STILL listen and watch others!
      acquiredStream = new MediaStream();
      actualMuted = true;
      actualVideoOff = true;
      setConnectionNotice('Microphone not detected or blocked. Connected as listener/viewer.');
    }

    localStreamRef.current = acquiredStream;
    setLocalStream(acquiredStream);
    setIsVideoOff(actualVideoOff);
    setIsMuted(actualMuted);
    setCurrentRoomId(roomId);
    setConnectionState('connected');

    // Setup speaking detection if audio track exists
    if (acquiredStream.getAudioTracks().length > 0) {
      setupAudioDetection(acquiredStream, roomId);
    }

    // Emit join event to standalone socket server
    socket.emit('join_voice_room', {
      roomId,
      userState: {
        userId: currentUser?.id,
        username: currentUser?.username || 'You',
        avatarColor: currentUser?.avatarColor || '#5865F2',
        isMuted: actualMuted,
        isVideoOff: actualVideoOff,
        isScreenSharing: false
      }
    });

    console.log(`[WebRTC] Joined voice room: ${roomId}`);
  }, [socket, currentUser, stopLocalTracks, closeAllPeerConnections, setupAudioDetection]);

  // Leave voice room
  const leaveVoiceRoom = useCallback(() => {
    if (socket && currentRoomId) {
      socket.emit('leave_voice_room');
    }
    stopLocalTracks();
    closeAllPeerConnections();
    setParticipants(new Map());
    setCurrentRoomId(null);
    setIsScreenSharing(false);
    setConnectionState('idle');
    setConnectionNotice(null);
    console.log('[WebRTC] Left voice room');
  }, [socket, currentRoomId, stopLocalTracks, closeAllPeerConnections]);

  // Toggle Microphone Mute
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      const newMuted = !isMuted;

      audioTracks.forEach((track) => {
        track.enabled = !newMuted;
      });
      setIsMuted(newMuted);

      if (socket && currentRoomId) {
        socket.emit('toggle_audio', {
          roomId: currentRoomId,
          isMuted: newMuted
        });
      }
    } else {
      setIsMuted(!isMuted);
    }
  }, [isMuted, socket, currentRoomId]);

  // Toggle Camera On/Off
  const toggleVideo = useCallback(async () => {
    if (!currentRoomId) return;

    if (isVideoOff) {
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        const newVideoTrack = videoStream.getVideoTracks()[0];

        if (localStreamRef.current) {
          localStreamRef.current.addTrack(newVideoTrack);
          // Add track to all active peer connections
          peerConnections.current.forEach((pc) => {
            pc.addTrack(newVideoTrack, localStreamRef.current!);
          });
        } else {
          localStreamRef.current = videoStream;
        }

        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        setIsVideoOff(false);

        if (socket) {
          socket.emit('toggle_video', {
            roomId: currentRoomId,
            isVideoOff: false
          });
        }
      } catch (err) {
        console.error('[WebRTC Video Error] Failed to enable camera:', err);
        alert('Could not start camera. Please verify device permissions.');
      }
    } else {
      if (localStreamRef.current) {
        const videoTracks = localStreamRef.current.getVideoTracks();
        videoTracks.forEach((track) => {
          track.stop();
          localStreamRef.current?.removeTrack(track);

          peerConnections.current.forEach((pc) => {
            const sender = pc.getSenders().find((s) => s.track === track);
            if (sender) pc.removeTrack(sender);
          });
        });

        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        setIsVideoOff(true);

        if (socket) {
          socket.emit('toggle_video', {
            roomId: currentRoomId,
            isVideoOff: true
          });
        }
      }
    }
  }, [isVideoOff, currentRoomId, socket]);

  // Toggle Screen Sharing
  const toggleScreenShare = useCallback(async () => {
    if (!currentRoomId) return;

    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        screenTrack.onended = () => {
          setIsScreenSharing(false);
          if (socket) {
            socket.emit('toggle_screen', { roomId: currentRoomId, isScreenSharing: false });
          }
        };

        // Replace or add track to peers
        peerConnections.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          } else {
            pc.addTrack(screenTrack, screenStream);
          }
        });

        setIsScreenSharing(true);
        if (socket) {
          socket.emit('toggle_screen', { roomId: currentRoomId, isScreenSharing: true });
        }
      } catch (err) {
        console.warn('[WebRTC Screen Share] Cancelled or failed:', err);
      }
    } else {
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }
      setIsScreenSharing(false);
      if (socket) {
        socket.emit('toggle_screen', { roomId: currentRoomId, isScreenSharing: false });
      }
    }
  }, [isScreenSharing, currentRoomId, socket]);

  // Socket WebRTC events listener
  useEffect(() => {
    if (!socket) return;

    // Receive list of existing participants in room
    const handleExistingParticipants = async ({ roomId, participants: existingList }: { roomId: string; participants: VoiceParticipant[] }) => {
      console.log(`[WebRTC] Existing participants in ${roomId}:`, existingList);
      const pMap = new Map<string, VoiceParticipant>();

      for (const p of existingList) {
        if (p.socketId === socket.id) continue;
        pMap.set(p.socketId, p);

        // Initiate WebRTC offer to existing participant
        const pc = createPeerConnection(p.socketId, roomId);
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('voice_offer', {
            toSocketId: p.socketId,
            offer,
            roomId
          });
        } catch (err) {
          console.error('[WebRTC Offer Error]:', err);
        }
      }

      setParticipants(pMap);
    };

    // Another user joined the voice room
    const handleUserJoinedVoice = ({ participant }: { roomId: string; participant: VoiceParticipant }) => {
      if (participant.socketId === socket.id) return;
      console.log(`[WebRTC] Peer joined room: ${participant.username} (${participant.socketId})`);
      setParticipants((prev) => {
        const next = new Map(prev);
        next.set(participant.socketId, participant);
        return next;
      });
    };

    // Received an offer from a peer
    const handleVoiceOffer = async ({ fromSocketId, offer, roomId, user }: { fromSocketId: string; offer: RTCSessionDescriptionInit; roomId: string; user: VoiceParticipant }) => {
      console.log(`[WebRTC] Received offer from ${fromSocketId}`);
      const pc = createPeerConnection(fromSocketId, roomId);

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        // Drain any ICE candidates received before remoteDescription was set
        await drainPendingCandidates(fromSocketId, pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('voice_answer', {
          toSocketId: fromSocketId,
          answer,
          roomId
        });

        // Ensure participant exists in state
        setParticipants((prev) => {
          const next = new Map(prev);
          if (!next.has(fromSocketId)) {
            next.set(fromSocketId, user);
          }
          return next;
        });
      } catch (err) {
        console.error('[WebRTC Answer Error]:', err);
      }
    };

    // Received an answer from a peer
    const handleVoiceAnswer = async ({ fromSocketId, answer }: { fromSocketId: string; answer: RTCSessionDescriptionInit }) => {
      console.log(`[WebRTC] Received answer from ${fromSocketId}`);
      const pc = peerConnections.current.get(fromSocketId);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          // Drain any ICE candidates received before remoteDescription was set
          await drainPendingCandidates(fromSocketId, pc);
        } catch (err) {
          console.error('[WebRTC SetRemoteAnswer Error]:', err);
        }
      }
    };

    // Received an ICE candidate from a peer
    const handleIceCandidate = async ({ fromSocketId, candidate }: { fromSocketId: string; candidate: RTCIceCandidateInit }) => {
      const pc = peerConnections.current.get(fromSocketId);
      if (pc && pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('[WebRTC AddIceCandidate Error]:', err);
        }
      } else {
        // Queue until remoteDescription is set!
        if (!pendingCandidates.current.has(fromSocketId)) {
          pendingCandidates.current.set(fromSocketId, []);
        }
        pendingCandidates.current.get(fromSocketId)!.push(candidate);
      }
    };

    // Remote participant toggled audio
    const handleUserToggledAudio = ({ socketId, isMuted: peerMuted }: { socketId: string; isMuted: boolean }) => {
      setParticipants((prev) => {
        const next = new Map(prev);
        const p = next.get(socketId);
        if (p) next.set(socketId, { ...p, isMuted: peerMuted });
        return next;
      });
    };

    // Remote participant toggled video
    const handleUserToggledVideo = ({ socketId, isVideoOff: peerVideoOff }: { socketId: string; isVideoOff: boolean }) => {
      setParticipants((prev) => {
        const next = new Map(prev);
        const p = next.get(socketId);
        if (p) next.set(socketId, { ...p, isVideoOff: peerVideoOff });
        return next;
      });
    };

    // Remote participant speaking indicator
    const handleSpeakingStatus = ({ socketId, isSpeaking: peerSpeaking }: { socketId: string; isSpeaking: boolean }) => {
      setParticipants((prev) => {
        const next = new Map(prev);
        const p = next.get(socketId);
        if (p) next.set(socketId, { ...p, isSpeaking: peerSpeaking });
        return next;
      });
    };

    // User left voice room
    const handleUserLeftVoice = ({ socketId }: { socketId: string }) => {
      console.log(`[WebRTC] Peer ${socketId} left room`);
      const pc = peerConnections.current.get(socketId);
      if (pc) {
        try {
          pc.close();
        } catch {}
        peerConnections.current.delete(socketId);
      }
      pendingCandidates.current.delete(socketId);
      setParticipants((prev) => {
        const next = new Map(prev);
        next.delete(socketId);
        return next;
      });
    };

    socket.on('existing_voice_participants', handleExistingParticipants);
    socket.on('user_joined_voice', handleUserJoinedVoice);
    socket.on('voice_offer', handleVoiceOffer);
    socket.on('voice_answer', handleVoiceAnswer);
    socket.on('ice_candidate', handleIceCandidate);
    socket.on('user_toggled_audio', handleUserToggledAudio);
    socket.on('user_toggled_video', handleUserToggledVideo);
    socket.on('user_speaking_status', handleSpeakingStatus);
    socket.on('user_left_voice', handleUserLeftVoice);

    return () => {
      socket.off('existing_voice_participants', handleExistingParticipants);
      socket.off('user_joined_voice', handleUserJoinedVoice);
      socket.off('voice_offer', handleVoiceOffer);
      socket.off('voice_answer', handleVoiceAnswer);
      socket.off('ice_candidate', handleIceCandidate);
      socket.off('user_toggled_audio', handleUserToggledAudio);
      socket.off('user_toggled_video', handleUserToggledVideo);
      socket.off('user_speaking_status', handleSpeakingStatus);
      socket.off('user_left_voice', handleUserLeftVoice);
    };
  }, [socket, createPeerConnection, drainPendingCandidates]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopLocalTracks();
      closeAllPeerConnections();
    };
  }, [stopLocalTracks, closeAllPeerConnections]);

  return {
    currentRoomId,
    localStream,
    participants: Array.from(participants.values()),
    isMuted,
    isVideoOff,
    isScreenSharing,
    connectionState,
    connectionNotice,
    joinVoiceRoom,
    leaveVoiceRoom,
    toggleAudio,
    toggleVideo,
    toggleScreenShare
  };
};
