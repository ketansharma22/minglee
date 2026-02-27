// app/chat/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useChat } from '@/hooks/useChat';
import { useChatStore } from '@/lib/store/chatStore';
import { VideoPanel } from '@/components/video/VideoPanel';
import { ChatPanel } from '@/components/chat/ChatPanel';

type Layout = 'split' | 'chat-focus' | 'video-focus';

export default function ChatPage() {
  const router = useRouter();
  const { userStatus, connectionStatus, onlineCount, chattingCount, waitingCount, setTheme, theme } = useChatStore();
  const { startChat, sendMessage, notifyTyping, nextChat, disconnect, webrtc } = useChat();
  const [layout, setLayout] = useState<Layout>('split');
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Auto-start on mount
  useEffect(() => {
    const timer = setTimeout(() => startChat(), 300);
    return () => clearTimeout(timer);
  }, [startChat]);

  const handleGoHome = () => {
    disconnect();
    router.push('/');
  };

  const statusConfig = {
    idle: { label: 'Idle', color: 'var(--color-text-muted)' },
    waiting: { label: 'Finding stranger...', color: 'var(--color-warning)' },
    connected: { label: 'Connected', color: 'var(--color-success)' },
    disconnected: { label: 'Disconnected', color: 'var(--color-danger)' },
  };

  const currentStatus = statusConfig[userStatus] || statusConfig.idle;

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 py-3 z-10 flex-shrink-0"
        style={{
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          height: 56,
        }}
      >
        {/* Left: Logo + status */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleGoHome}
            className="font-bold flex items-center gap-2 transition-opacity hover:opacity-70"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.1rem',
              color: 'var(--color-text)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            ← Novu
          </button>

          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-xs"
            style={{
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              color: currentStatus.color,
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: currentStatus.color,
                boxShadow: userStatus === 'connected'
                  ? `0 0 6px ${currentStatus.color}`
                  : userStatus === 'waiting'
                  ? 'none'
                  : 'none',
              }}
            />
            {userStatus === 'waiting' ? (
              <span className="flex items-center gap-1">
                <span className="typing-dot" style={{ background: 'var(--color-warning)' }} />
                <span className="typing-dot" style={{ background: 'var(--color-warning)' }} />
                <span className="typing-dot" style={{ background: 'var(--color-warning)' }} />
                Searching
              </span>
            ) : currentStatus.label}
          </div>
        </div>

        {/* Center: Stats (desktop) */}
        <div
          className="hidden md:flex items-center gap-4 text-xs"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <span><strong style={{ color: 'var(--color-text)' }}>{onlineCount}</strong> online</span>
          <span><strong style={{ color: 'var(--color-text)' }}>{chattingCount}</strong> chatting</span>
        </div>

        {/* Right: Layout + theme controls */}
        <div className="flex items-center gap-2">
          {/* Layout switcher (desktop only) */}
          {!isMobile && (
            <div
              className="flex gap-1 p-1 rounded-lg"
              style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
            >
              {(['split', 'video-focus', 'chat-focus'] as Layout[]).map(l => (
                <button
                  key={l}
                  onClick={() => setLayout(l)}
                  title={l.replace('-', ' ')}
                  className="px-2 py-1 rounded text-xs transition-all duration-200"
                  style={{
                    background: layout === l ? 'var(--color-surface-3)' : 'transparent',
                    color: layout === l ? 'var(--color-text)' : 'var(--color-text-muted)',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                  }}
                >
                  {l === 'split' ? '⊡' : l === 'video-focus' ? '□' : '☰'}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="btn-ghost text-xs px-3 py-1.5"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {userStatus === 'connected' && (
            <>
              <button
                onClick={nextChat}
                className="btn-ghost text-xs px-3 py-1.5 hidden sm:flex"
              >
                ⏭ Next
              </button>
              <button
                onClick={disconnect}
                className="btn-danger text-xs px-3 py-1.5 hidden sm:flex"
              >
                ✕ Stop
              </button>
            </>
          )}

          {(userStatus === 'idle' || userStatus === 'disconnected') && (
            <button onClick={startChat} className="btn-primary text-xs px-4 py-2">
              🔍 Find Stranger
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        {isMobile ? (
          // Mobile: Stacked layout
          <MobileLayout
            webrtc={webrtc}
            onSendMessage={sendMessage}
            onTyping={notifyTyping}
            onNext={nextChat}
            onDisconnect={disconnect}
            connectionStatus={connectionStatus}
          />
        ) : (
          // Desktop: Configurable split
          <DesktopLayout
            layout={layout}
            webrtc={webrtc}
            onSendMessage={sendMessage}
            onTyping={notifyTyping}
            onNext={nextChat}
            onDisconnect={disconnect}
            connectionStatus={connectionStatus}
          />
        )}
      </main>

      {/* Waiting overlay */}
      {userStatus === 'waiting' && (
        <WaitingOverlay onCancel={disconnect} count={waitingCount} />
      )}
    </div>
  );
}

// ─── Desktop Layout ─────────────────────────────────────────────────────────
function DesktopLayout({
  layout,
  webrtc,
  onSendMessage,
  onTyping,
  onNext,
  onDisconnect,
  connectionStatus,
}: {
  layout: Layout;
  webrtc: ReturnType<typeof useChat>['webrtc'];
  onSendMessage: (m: string) => void;
  onTyping: () => void;
  onNext: () => void;
  onDisconnect: () => void;
  connectionStatus: import('@/types').ConnectionStatus;
}) {
  if (layout === 'video-focus') {
    return (
      <div className="h-full">
        <VideoPanel
          localStream={webrtc.localStream}
          remoteStream={webrtc.remoteStream}
          connectionStatus={connectionStatus}
          videoEnabled={webrtc.videoEnabled}
          audioEnabled={webrtc.audioEnabled}
          mediaError={webrtc.mediaError}
          onToggleVideo={webrtc.toggleVideo}
          onToggleAudio={webrtc.toggleAudio}
        />
      </div>
    );
  }

  if (layout === 'chat-focus') {
    return (
      <div className="h-full">
        <ChatPanel
          onSendMessage={onSendMessage}
          onTyping={onTyping}
          onNext={onNext}
          onDisconnect={onDisconnect}
        />
      </div>
    );
  }

  // Split layout (default)
  return (
    <div className="h-full flex">
      {/* Video - 60% */}
      <div
        style={{ flex: '0 0 60%', borderRight: '1px solid var(--color-border)' }}
      >
        <VideoPanel
          localStream={webrtc.localStream}
          remoteStream={webrtc.remoteStream}
          connectionStatus={connectionStatus}
          videoEnabled={webrtc.videoEnabled}
          audioEnabled={webrtc.audioEnabled}
          mediaError={webrtc.mediaError}
          onToggleVideo={webrtc.toggleVideo}
          onToggleAudio={webrtc.toggleAudio}
        />
      </div>
      {/* Chat - 40% */}
      <div style={{ flex: '1 1 40%' }}>
        <ChatPanel
          onSendMessage={onSendMessage}
          onTyping={onTyping}
          onNext={onNext}
          onDisconnect={onDisconnect}
        />
      </div>
    </div>
  );
}

// ─── Mobile Layout ───────────────────────────────────────────────────────────
function MobileLayout({
  webrtc,
  onSendMessage,
  onTyping,
  onNext,
  onDisconnect,
  connectionStatus,
}: {
  webrtc: ReturnType<typeof useChat>['webrtc'];
  onSendMessage: (m: string) => void;
  onTyping: () => void;
  onNext: () => void;
  onDisconnect: () => void;
  connectionStatus: import('@/types').ConnectionStatus;
}) {
  return (
    <div className="h-full flex flex-col">
      {/* Video — top third */}
      <div style={{ flex: '0 0 40%', borderBottom: '1px solid var(--color-border)' }}>
        <VideoPanel
          localStream={webrtc.localStream}
          remoteStream={webrtc.remoteStream}
          connectionStatus={connectionStatus}
          videoEnabled={webrtc.videoEnabled}
          audioEnabled={webrtc.audioEnabled}
          mediaError={webrtc.mediaError}
          onToggleVideo={webrtc.toggleVideo}
          onToggleAudio={webrtc.toggleAudio}
        />
      </div>
      {/* Chat — remaining space */}
      <div style={{ flex: 1, minHeight: 0, paddingBottom: '0px' }}>
        <ChatPanel
          onSendMessage={onSendMessage}
          onTyping={onTyping}
          onNext={onNext}
          onDisconnect={onDisconnect}
        />
      </div>
    </div>
  );
}

// ─── Waiting Overlay ─────────────────────────────────────────────────────────
function WaitingOverlay({ onCancel, count }: { onCancel: () => void; count: number }) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-50"
      style={{
        background: 'rgba(10,10,15,0.85)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div
        className="glass-card rounded-3xl p-8 text-center max-w-sm w-full mx-4"
        style={{ animation: 'slideUp 0.3s ease forwards' }}
      >
        {/* Animated circles */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="absolute inset-0 rounded-full"
              style={{
                border: `2px solid var(--color-accent)`,
                opacity: 1 - i * 0.25,
                animation: `pulseSoft ${1.5 + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
                transform: `scale(${1 + i * 0.3})`,
              }}
            />
          ))}
          <div
            className="absolute inset-0 rounded-full flex items-center justify-center"
            style={{ background: 'var(--color-surface-3)', fontSize: '1.5rem' }}
          >
            🔍
          </div>
        </div>

        <h2
          className="font-semibold mb-2"
          style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--color-text)' }}
        >
          Finding a stranger{dots}
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: 24 }}>
          {count > 1 ? `${count} others in queue` : 'You\'re up next!'}
        </p>

        <button
          onClick={onCancel}
          className="btn-ghost w-full"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
