// hooks/useWebRTC.ts
'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import type { AppSocket } from '../lib/socket/client';
import type { ConnectionStatus } from '../types';

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
  roomId: string | null;
  isInitiator: boolean;
  onConnectionStatusChange?: (status: ConnectionStatus) => void;
}

export function useWebRTC({ socket, roomId, isInitiator, onConnectionStatusChange }: UseWebRTCOptions) {
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
  const [hasMedia, setHasMedia] = useState(false);

  const updateStatus = useCallback((status: ConnectionStatus) => {
    setConnectionStatus(status);
    onConnectionStatusChange?.(status);
  }, [onConnectionStatusChange]);

  const getLocalMedia = useCallback(async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 48000 },
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setHasMedia(true);
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
      setHasMedia(false);
      return null;
    }
  }, []);

  const createPeerConnection = useCallback((): RTCPeerConnection => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote stream
    const remoteMediaStream = new MediaStream();
    setRemoteStream(remoteMediaStream);

    pc.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach(track => {
        remoteMediaStream.addTrack(track);
      });
      setRemoteStream(new MediaStream(remoteMediaStream.getTracks()));
    };

    // ICE candidate handling
    pc.onicecandidate = (event) => {
      if (event.candidate && socket && roomId) {
        socket.emit('signal:send', {
          roomId,
          type: 'ice-candidate',
          data: event.candidate.toJSON(),
        });
      }
    };

    // Connection state changes
    pc.onconnectionstatechange = () => {
      switch (pc.connectionState) {
        case 'connecting': updateStatus('connecting'); break;
        case 'connected': updateStatus('connected'); break;
        case 'failed':
          updateStatus('failed');
          // Auto restart ICE
          pc.restartIce();
          break;
        case 'disconnected': updateStatus('reconnecting'); break;
        case 'closed': updateStatus('idle'); break;
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') {
        pc.restartIce();
      }
    };

    return pc;
  }, [socket, roomId, updateStatus]);

  const startCall = useCallback(async () => {
    if (!socket || !roomId) return;

    updateStatus('connecting');
    const pc = createPeerConnection();

    if (isInitiator) {
      try {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await pc.setLocalDescription(offer);

        socket.emit('signal:send', {
          roomId,
          type: 'offer',
          data: offer,
        });
      } catch (err) {
        console.error('Failed to create offer:', err);
        updateStatus('failed');
      }
    }
  }, [socket, roomId, isInitiator, createPeerConnection, updateStatus]);

  const handleSignal = useCallback(async (type: string, data: RTCSessionDescriptionInit | RTCIceCandidateInit) => {
    const pc = peerConnectionRef.current;
    if (!pc || !socket || !roomId) return;

    try {
      if (type === 'offer') {
        isSettingRemoteDescriptionRef.current = true;
        await pc.setRemoteDescription(new RTCSessionDescription(data as RTCSessionDescriptionInit));
        isSettingRemoteDescriptionRef.current = false;

        // Flush pending ICE candidates
        for (const candidate of pendingCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidatesRef.current = [];

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('signal:send', {
          roomId,
          type: 'answer',
          data: answer,
        });
      } else if (type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(data as RTCSessionDescriptionInit));

        // Flush pending candidates
        for (const candidate of pendingCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
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
      console.error(`WebRTC signal error (${type}):`, err);
    }
  }, [socket, roomId]);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setVideoEnabled(prev => !prev);
    }
  }, []);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setAudioEnabled(prev => !prev);
    }
  }, []);

  const cleanup = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    updateStatus('idle');
    pendingCandidatesRef.current = [];
  }, [updateStatus]);

  // Handle incoming signals from socket
  useEffect(() => {
    if (!socket) return;

    const handleSignalReceive = ({ type, data }: { type: string; data: RTCSessionDescriptionInit | RTCIceCandidateInit }) => {
      handleSignal(type, data);
    };

    socket.on('signal:receive', handleSignalReceive);
    return () => { socket.off('signal:receive', handleSignalReceive); };
  }, [socket, handleSignal]);

  return {
    localStream,
    remoteStream,
    connectionStatus,
    videoEnabled,
    audioEnabled,
    mediaError,
    hasMedia,
    getLocalMedia,
    startCall,
    toggleVideo,
    toggleAudio,
    cleanup,
  };
}
