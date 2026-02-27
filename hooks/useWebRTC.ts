// hooks/useWebRTC.ts
'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import type { AppSocket } from '@/lib/socket/client';
import type { ConnectionStatus } from '@/types';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    ...(process.env.NEXT_PUBLIC_TURN_URL
      ? [{
          urls: process.env.NEXT_PUBLIC_TURN_URL,
          username: process.env.NEXT_PUBLIC_TURN_USERNAME || '',
          credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL || '',
        }]
      : []),
  ],
  iceCandidatePoolSize: 10,
};

interface UseWebRTCOptions {
  socket: AppSocket | null;
  onConnectionStatusChange?: (status: ConnectionStatus) => void;
}

export function useWebRTC({ socket, onConnectionStatusChange }: UseWebRTCOptions) {
  const socketRef = useRef<AppSocket | null>(null);
  const roomIdRef = useRef<string | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const isSettingRemoteDescriptionRef = useRef(false);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [mediaError, setMediaError] = useState<string | null>(null);

  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  const updateStatus = useCallback((status: ConnectionStatus) => {
    setConnectionStatus(status);
    onConnectionStatusChange?.(status);
  }, [onConnectionStatusChange]);

  const getLocalMedia = useCallback(async (): Promise<MediaStream | null> => {
    if (localStreamRef.current) return localStreamRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 48000 },
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setMediaError(null);
      return stream;
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === 'NotAllowedError') {
        setMediaError('Camera/microphone permission denied. You can still text chat.');
      } else if (error.name === 'NotFoundError') {
        setMediaError('No camera or microphone found. You can still text chat.');
      } else {
        setMediaError('Could not access media devices. You can still text chat.');
      }
      return null;
    }
  }, []);

  const createPeerConnection = useCallback((stream: MediaStream | null): RTCPeerConnection => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    if (stream) {
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
    }

    pc.ontrack = (event) => {
      const incomingStream = event.streams[0];
      if (incomingStream) {
        setRemoteStream(incomingStream);
      }
    };

    // Use refs so these callbacks always have current values
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && roomIdRef.current) {
        socketRef.current.emit('signal:send', {
          roomId: roomIdRef.current,
          type: 'ice-candidate',
          data: event.candidate.toJSON(),
        });
      }
    };

    pc.onconnectionstatechange = () => {
      switch (pc.connectionState) {
        case 'connecting':   updateStatus('connecting'); break;
        case 'connected':    updateStatus('connected'); break;
        case 'failed':       updateStatus('failed'); pc.restartIce(); break;
        case 'disconnected': updateStatus('reconnecting'); break;
        case 'closed':       updateStatus('idle'); break;
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') pc.restartIce();
    };

    return pc;
  }, [updateStatus]);

  const startCall = useCallback(async (
    roomId: string,
    isInitiator: boolean,
    stream: MediaStream | null,
  ) => {
    roomIdRef.current = roomId;
    updateStatus('connecting');
    const pc = createPeerConnection(stream);

    if (isInitiator) {
      try {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await pc.setLocalDescription(offer);

        if (socketRef.current) {
          socketRef.current.emit('signal:send', { roomId, type: 'offer', data: offer });
        }
      } catch (err) {
        console.error('Failed to create offer:', err);
        updateStatus('failed');
      }
    }
  }, [createPeerConnection, updateStatus]);

  const handleSignal = useCallback(async (
    type: string,
    data: RTCSessionDescriptionInit | RTCIceCandidateInit,
  ) => {
    const pc = peerConnectionRef.current;
    const sock = socketRef.current;
    const roomId = roomIdRef.current;

    if (!pc || !sock || !roomId) {
      console.warn('[WebRTC] handleSignal: missing pc/socket/roomId', { pc: !!pc, sock: !!sock, roomId });
      return;
    }

    try {
      if (type === 'offer') {
        isSettingRemoteDescriptionRef.current = true;
        await pc.setRemoteDescription(new RTCSessionDescription(data as RTCSessionDescriptionInit));
        isSettingRemoteDescriptionRef.current = false;

        for (const c of pendingCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(c));
        }
        pendingCandidatesRef.current = [];

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sock.emit('signal:send', { roomId, type: 'answer', data: answer });

      } else if (type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(data as RTCSessionDescriptionInit));

        for (const c of pendingCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(c));
        }
        pendingCandidatesRef.current = [];

      } else if (type === 'ice-candidate') {
        const candidate = data as RTCIceCandidateInit;
        if (pc.remoteDescription && !isSettingRemoteDescriptionRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          pendingCandidatesRef.current.push(candidate);
        }
      }
    } catch (err) {
      console.error(`[WebRTC] signal error (${type}):`, err);
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
      setVideoEnabled(prev => !prev);
    }
  }, []);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
      setAudioEnabled(prev => !prev);
    }
  }, []);

  const cleanup = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    roomIdRef.current = null;
    pendingCandidatesRef.current = [];
    setLocalStream(null);
    setRemoteStream(null);
    updateStatus('idle');
  }, [updateStatus]);

  useEffect(() => {
    if (!socket) return;
    const onSignal = ({ type, data }: { type: string; data: RTCSessionDescriptionInit | RTCIceCandidateInit }) => {
      handleSignal(type, data);
    };
    socket.on('signal:receive', onSignal);
    return () => { socket.off('signal:receive', onSignal); };
  }, [socket, handleSignal]);

  return {
    localStream,
    remoteStream,
    connectionStatus,
    videoEnabled,
    audioEnabled,
    mediaError,
    getLocalMedia,
    startCall,
    toggleVideo,
    toggleAudio,
    cleanup,
  };
}
