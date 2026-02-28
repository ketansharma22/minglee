// app/chat/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useChat } from '../../hooks/useChat';
import { useChatStore } from '../../lib/store/chatStore';
import { VideoPanel } from '../../components/video/VideoPanel';
import { ChatPanel } from '../../components/chat/ChatPanel';

type Layout = 'split' | 'chat-focus' | 'video-focus';

const HEADER_HEIGHT = 52;

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
    waiting: { label: 'Searching...', color: 'var(--color-warning)' },
    connected: { label: 'Connected', color: 'var(--color-success)' },
    disconnected: { label: 'Disconnected', color: 'var(--color-danger)' },
  };

  const currentStatus = statusConfig[userStatus] || statusConfig.idle;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        overflow: 'hidden',
        background: 'var(--color-bg)',
      }}
    >
      {/* ── Header ────────────────────────────────────────────────── */}
      <header
        style={{
          height: HEADER_HEIGHT,
          minHeight: HEADER_HEIGHT,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          position: 'relative',
          zIndex: 20,
          gap: 8,
        }}
      >
        {/* Left: Logo + status pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button
            onClick={handleGoHome}
            aria-label="Go home"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '1rem',
              color: 'var(--color-text)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 6px',
              borderRadius: 8,
              whiteSpace: 'nowrap',
              transition: 'opacity 0.15s',
            }}
            onMouseOver={e => (e.currentTarget.style.opacity = '0.7')}
            onMouseOut={e => (e.currentTarget.style.opacity = '1')}
          >
            ← Novu
          </button>

          {/* Status pill — hidden on very small screens */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '3px 10px',
              borderRadius: 999,
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              color: currentStatus.color,
              fontSize: '0.7rem',
              whiteSpace: 'nowrap',
            }}
            className="hidden sm:flex"
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: currentStatus.color,
                boxShadow: userStatus === 'connected' ? `0 0 6px ${currentStatus.color}` : 'none',
                flexShrink: 0,
              }}
            />
            {userStatus === 'waiting' ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span className="typing-dot" style={{ background: 'var(--color-warning)' }} />
                <span className="typing-dot" style={{ background: 'var(--color-warning)' }} />
                <span className="typing-dot" style={{ background: 'var(--color-warning)' }} />
                <span style={{ marginLeft: 2 }}>Searching</span>
              </span>
            ) : currentStatus.label}
          </div>
        </div>

        {/* Center: Stats — desktop only */}
        <div
          className="hidden md:flex"
          style={{
            alignItems: 'center',
            gap: 16,
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <span><strong style={{ color: 'var(--color-text)' }}>{onlineCount}</strong> online</span>
          <span><strong style={{ color: 'var(--color-text)' }}>{chattingCount}</strong> chatting</span>
        </div>

        {/* Right: controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* Layout switcher — desktop only */}
          {!isMobile && (
            <div
              style={{
                display: 'flex',
                gap: 2,
                padding: 3,
                borderRadius: 8,
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
              }}
            >
              {(['split', 'video-focus', 'chat-focus'] as Layout[]).map(l => (
                <button
                  key={l}
                  onClick={() => setLayout(l)}
                  title={l.replace(/-/g, ' ')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: layout === l ? 'var(--color-surface-3)' : 'transparent',
                    color: layout === l ? 'var(--color-text)' : 'var(--color-text-muted)',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    transition: 'all 0.15s',
                  }}
                >
                  {l === 'split' ? '⊡' : l === 'video-focus' ? '□' : '☰'}
                </button>
              ))}
            </div>
          )}

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
            style={{
              padding: '5px 10px',
              borderRadius: 8,
              background: 'transparent',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              lineHeight: 1,
            }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* Next / Stop — desktop only (mobile has them in chat panel) */}
          {userStatus === 'connected' && !isMobile && (
            <>
              <button onClick={nextChat} className="btn-ghost" style={{ fontSize: '0.75rem', padding: '5px 12px' }}>
                ⏭ Next
              </button>
              <button onClick={disconnect} className="btn-danger" style={{ fontSize: '0.75rem', padding: '5px 12px' }}>
                ✕ Stop
              </button>
            </>
          )}

          {/* Find — when idle */}
          {(userStatus === 'idle' || userStatus === 'disconnected') && (
            <button onClick={startChat} className="btn-primary" style={{ fontSize: '0.75rem', padding: '6px 14px' }}>
              🔍 {isMobile ? 'Find' : 'Find Stranger'}
            </button>
          )}
        </div>
      </header>

      {/* ── Main content — fills remaining height exactly ─────────── */}
      <main
        style={{
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {isMobile ? (
          <MobileLayout
            webrtc={webrtc}
            onSendMessage={sendMessage}
            onTyping={notifyTyping}
            onNext={nextChat}
            onDisconnect={disconnect}
            connectionStatus={connectionStatus}
          />
        ) : (
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
  const panelStyle: React.CSSProperties = { width: '100%', height: '100%', overflow: 'hidden' };

  if (layout === 'video-focus') {
    return (
      <div style={panelStyle}>
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
      <div style={panelStyle}>
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
    <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Video — 60% */}
      <div style={{ flex: '0 0 60%', minWidth: 0, borderRight: '1px solid var(--color-border)', overflow: 'hidden' }}>
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
      {/* Chat — 40% */}
      <div style={{ flex: '1 1 40%', minWidth: 0, overflow: 'hidden' }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Video — fixed pixel height so chat always has room */}
      <div
        style={{
          flexShrink: 0,
          height: 260,
          borderBottom: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}
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
      {/* Chat — fills all remaining space, scrolls internally */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
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
