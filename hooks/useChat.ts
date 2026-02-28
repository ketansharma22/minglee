// hooks/useChat.ts
'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { socketService } from '../lib/socket/client';
import { useChatStore } from '../lib/store/chatStore';
import { useAuthStore } from '../lib/store/authStore';
import { useWebRTC } from './useWebRTC';
import type { AppSocket } from '../lib/socket/client';

export function useChat() {
  const socketRef = useRef<AppSocket | null>(null);
  const [socket, setSocket] = useState<AppSocket | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  const { user } = useAuthStore();

  const {
    userStatus,
    roomId,
    isInitiator,
    interests,
    setUserStatus,
    setConnectionStatus,
    setRoom,
    addMessage,
    addSystemMessage,
    clearMessages,
    setTyping,
    setStats,
    reset,
  } = useChatStore();

  const webrtc = useWebRTC({
    socket,
    roomId,
    isInitiator,
    onConnectionStatusChange: setConnectionStatus,
  });

  // Initialize socket connection
  useEffect(() => {
    const sock = socketService.connect(user?.uid);
    socketRef.current = sock;
    setSocket(sock);

    sock.on('connect', () => {
      console.log('Socket connected:', sock.id);
    });

    sock.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setUserStatus('idle');
    });

    sock.on('stats:update', (stats) => {
      setStats({ online: stats.online, waiting: stats.waiting, chatting: stats.chatting });
    });

    sock.on('error', (payload) => {
      addSystemMessage(`Error: ${payload.message}`);
    });

    return () => {
      sock.off('connect');
      sock.off('connect_error');
      sock.off('stats:update');
      sock.off('error');
    };
  }, [setUserStatus, setStats, addSystemMessage]);

  // Match found handler
  useEffect(() => {
    if (!socket) return;

    const handleMatchFound = async ({ roomId, isInitiator }: { roomId: string; peerId: string; isInitiator: boolean }) => {
      setRoom(roomId, isInitiator);
      setUserStatus('connected');
      clearMessages();
      addSystemMessage('You are now chatting with a stranger. Say hi!');

      // Start WebRTC call
      await webrtc.getLocalMedia();
      await webrtc.startCall();
    };

    socket.on('match:found', handleMatchFound);
    return () => { socket.off('match:found', handleMatchFound); };
  }, [socket, setRoom, setUserStatus, clearMessages, addSystemMessage, webrtc]);

  // Queue waiting
  useEffect(() => {
    if (!socket) return;

    socket.on('queue:waiting', ({ position }) => {
      setUserStatus('waiting');
    });

    return () => { socket.off('queue:waiting'); };
  }, [socket, setUserStatus]);

  // Incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleMessage = ({ content, timestamp }: { roomId: string; content: string; messageId: string; timestamp: number }) => {
      addMessage({
        type: 'text',
        content,
        sender: 'stranger',
        timestamp,
        status: 'delivered',
      });
    };

    socket.on('message:receive', handleMessage);
    return () => { socket.off('message:receive', handleMessage); };
  }, [socket, addMessage]);

  // Typing indicator
  useEffect(() => {
    if (!socket) return;

    const handleTyping = ({ isTyping }: { roomId: string; isTyping: boolean }) => {
      setTyping(isTyping);
    };

    socket.on('typing:update', handleTyping);
    return () => { socket.off('typing:update', handleTyping); };
  }, [socket, setTyping]);

  // Stranger disconnect
  useEffect(() => {
    if (!socket) return;

    const handleStrangerDisconnect = () => {
      addSystemMessage('Stranger has disconnected.');
      webrtc.cleanup();
      setRoom(null);
      setUserStatus('idle');
      setTyping(false);
    };

    socket.on('chat:stranger_disconnected', handleStrangerDisconnect);
    return () => { socket.off('chat:stranger_disconnected', handleStrangerDisconnect); };
  }, [socket, addSystemMessage, webrtc, setRoom, setUserStatus, setTyping]);

  // ─── Actions ────────────────────────────────────────────────────────────────
  const startChat = useCallback(() => {
    if (!socket) return;
    setUserStatus('waiting');
    socket.emit('queue:join', { interests });
  }, [socket, interests, setUserStatus]);

  const sendMessage = useCallback((content: string) => {
    if (!socket || !roomId || !content.trim()) return;

    // Stop typing
    if (isTypingRef.current) {
      socket.emit('typing:stop', { roomId });
      isTypingRef.current = false;
    }

    const timestamp = Date.now();

    // Optimistic add
    useChatStore.getState().addMessage({
      type: 'text',
      content: content.trim(),
      sender: 'me',
      timestamp,
      status: 'sent',
    });

    socket.emit('message:send', {
      roomId,
      content: content.trim(),
      messageId: Math.random().toString(36).slice(2),
      timestamp,
    });
  }, [socket, roomId]);

  const notifyTyping = useCallback(() => {
    if (!socket || !roomId) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing:start', { roomId });
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        socket.emit('typing:stop', { roomId });
      }
    }, 2000);
  }, [socket, roomId]);

  const nextChat = useCallback(() => {
    if (!socket) return;
    webrtc.cleanup();

    if (roomId) {
      socket.emit('chat:next');
    }

    reset();
    setUserStatus('waiting');
    socket.emit('queue:join', { interests });
  }, [socket, roomId, webrtc, reset, setUserStatus, interests]);

  const disconnect = useCallback(() => {
    if (!socket) return;
    webrtc.cleanup();

    if (roomId) {
      socket.emit('chat:disconnect', { roomId });
    } else {
      socket.emit('queue:leave');
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    reset();
    setUserStatus('idle');
  }, [socket, roomId, webrtc, reset, setUserStatus]);

  return {
    socket,
    webrtc,
    userStatus,
    roomId,
    startChat,
    sendMessage,
    notifyTyping,
    nextChat,
    disconnect,
  };
}
