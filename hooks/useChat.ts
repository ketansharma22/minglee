// hooks/useChat.ts
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { socketService } from '../lib/socket/client';
import { useChatStore } from '../lib/store/chatStore';
import { useWebRTC } from './useWebRTC';
import type { AppSocket } from '../lib/socket/client';

export function useChat() {
  // Store socket in a ref AND expose it — ref means it's always current in closures
  const socketRef = useRef<AppSocket | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  const {
    userStatus,
    roomId,
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
    socket: socketRef.current,
    onConnectionStatusChange: setConnectionStatus,
  });

  // Keep a stable ref to webrtc functions so useEffect closures never go stale
  const webrtcRef = useRef(webrtc);
  useEffect(() => {
    webrtcRef.current = webrtc;
  });

  // Initialize socket once
  useEffect(() => {
    const sock = socketService.connect();
    socketRef.current = sock;

    sock.on('connect', () => console.log('[Socket] connected:', sock.id));
    sock.on('connect_error', (err) => {
      console.error('[Socket] connection error:', err);
      useChatStore.getState().setUserStatus('idle');
    });
    sock.on('stats:update', (stats) => {
      useChatStore.getState().setStats({ online: stats.online, waiting: stats.waiting, chatting: stats.chatting });
    });
    sock.on('error', (payload) => {
      useChatStore.getState().addSystemMessage(`Error: ${payload.message}`);
    });

    // ── match:found ────────────────────────────────────────────────────────
    // Defined here so socketRef.current is always fresh when it fires
    sock.on('match:found', async ({ roomId, isInitiator }: { roomId: string; peerId: string; isInitiator: boolean }) => {
      const store = useChatStore.getState();
      store.setRoom(roomId, isInitiator);
      store.setUserStatus('connected');
      store.clearMessages();
      store.addSystemMessage('You are now chatting with a stranger. Say hi!');

      // Get media, then start call — pass roomId and isInitiator directly (never stale)
      const stream = await webrtcRef.current.getLocalMedia();
      await webrtcRef.current.startCall(roomId, isInitiator, stream);
    });

    // ── queue:waiting ──────────────────────────────────────────────────────
    sock.on('queue:waiting', () => {
      useChatStore.getState().setUserStatus('waiting');
    });

    // ── message:receive ────────────────────────────────────────────────────
    sock.on('message:receive', ({ content, timestamp }) => {
      useChatStore.getState().addMessage({
        type: 'text',
        content,
        sender: 'stranger',
        timestamp,
        status: 'delivered',
      });
    });

    // ── typing:update ──────────────────────────────────────────────────────
    sock.on('typing:update', ({ isTyping }) => {
      useChatStore.getState().setTyping(isTyping);
    });

    // ── chat:stranger_disconnected ─────────────────────────────────────────
    sock.on('chat:stranger_disconnected', () => {
      useChatStore.getState().addSystemMessage('Stranger has disconnected.');
      webrtcRef.current.cleanup();
      useChatStore.getState().setRoom(null);
      useChatStore.getState().setUserStatus('idle');
      useChatStore.getState().setTyping(false);
    });

    return () => {
      sock.off('connect');
      sock.off('connect_error');
      sock.off('stats:update');
      sock.off('error');
      sock.off('match:found');
      sock.off('queue:waiting');
      sock.off('message:receive');
      sock.off('typing:update');
      sock.off('chat:stranger_disconnected');
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — socket is initialized once, all handlers use refs/store directly

  // ── Actions ──────────────────────────────────────────────────────────────

  const startChat = useCallback(() => {
    const sock = socketRef.current;
    if (!sock) return;
    useChatStore.getState().setUserStatus('waiting');
    sock.emit('queue:join', { interests: useChatStore.getState().interests });
  }, []);

  const sendMessage = useCallback((content: string) => {
    const sock = socketRef.current;
    const currentRoomId = useChatStore.getState().roomId;
    if (!sock || !currentRoomId || !content.trim()) return;

    if (isTypingRef.current) {
      sock.emit('typing:stop', { roomId: currentRoomId });
      isTypingRef.current = false;
    }

    const timestamp = Date.now();
    useChatStore.getState().addMessage({
      type: 'text',
      content: content.trim(),
      sender: 'me',
      timestamp,
      status: 'sent',
    });

    sock.emit('message:send', {
      roomId: currentRoomId,
      content: content.trim(),
      messageId: Math.random().toString(36).slice(2),
      timestamp,
    });
  }, []);

  const notifyTyping = useCallback(() => {
    const sock = socketRef.current;
    const currentRoomId = useChatStore.getState().roomId;
    if (!sock || !currentRoomId) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sock.emit('typing:start', { roomId: currentRoomId });
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        sock.emit('typing:stop', { roomId: currentRoomId });
      }
    }, 2000);
  }, []);

  const nextChat = useCallback(() => {
    const sock = socketRef.current;
    if (!sock) return;
    webrtcRef.current.cleanup();
    sock.emit('chat:next');
    reset();
    useChatStore.getState().setUserStatus('waiting');
    sock.emit('queue:join', { interests: useChatStore.getState().interests });
  }, [reset]);

  const disconnect = useCallback(() => {
    const sock = socketRef.current;
    if (!sock) return;
    webrtcRef.current.cleanup();

    const currentRoomId = useChatStore.getState().roomId;
    if (currentRoomId) {
      sock.emit('chat:disconnect', { roomId: currentRoomId });
    } else {
      sock.emit('queue:leave');
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    reset();
    useChatStore.getState().setUserStatus('idle');
  }, [reset]);

  return {
    socket: socketRef.current,
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
