// app/chat/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useChat } from '../../hooks/useChat';
import { useChatStore } from '../../lib/store/chatStore';
import { useAuthStore } from '../../lib/store/authStore';
import { signOutUser, incrementChatCount } from '../../lib/firebase/auth';
import { VideoPanel } from '../../components/video/VideoPanel';
import { ChatPanel } from '../../components/chat/ChatPanel';
import type { ConnectionStatus } from '../../types';

type Layout = 'split' | 'chat-focus' | 'video-focus';
const HEADER_HEIGHT = 52;

export default function ChatPage() {
  const router = useRouter();
  const { user, profile, initialized } = useAuthStore();
  const { userStatus, connectionStatus, onlineCount, chattingCount, waitingCount, setTheme, theme } = useChatStore();
  const { startChat, sendMessage, notifyTyping, nextChat, disconnect, webrtc } = useChat();
  const [layout, setLayout] = useState<Layout>('split');
  const [isMobile, setIsMobile] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (initialized && !user) router.replace('/auth');
  }, [user, initialized, router]);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Auto-start on mount (once auth is confirmed)
  useEffect(() => {
    if (!user || !initialized) return;
    const timer = setTimeout(() => startChat(), 300);
    return () => clearTimeout(timer);
  }, [user, initialized, startChat]);

  // Track chat count when connected
  useEffect(() => {
    if (userStatus === 'connected' && user) {
      incrementChatCount(user.uid).catch(() => {});
    }
  }, [userStatus, user]);

  const handleGoHome = () => {
    disconnect();
    router.push('/');
  };

  const handleSignOut = async () => {
    disconnect();
    await signOutUser();
    router.replace('/auth');
  };

  const statusConfig = {
    idle: { label: 'Idle', color: 'var(--color-text-muted)' },
    waiting: { label: 'Searching...', color: 'var(--color-warning)' },
    connected: { label: 'Connected', color: 'var(--color-success)' },
    disconnected: { label: 'Disconnected', color: 'var(--color-danger)' },
  };
  const currentStatus = statusConfig[userStatus] || statusConfig.idle;

  const displayName = profile?.displayName || user?.displayName || 'User';

  if (!initialized || !user) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', background: 'var(--color-bg)' }}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header style={{
        height: HEADER_HEIGHT, minHeight: HEADER_HEIGHT, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 12px',
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        position: 'relative', zIndex: 20, gap: 8,
      }}>
        {/* Left: Logo + status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button
            onClick={handleGoHome}
            aria-label="Go home"
            style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem',
              color: 'var(--color-text)', background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4, padding: '4px 6px',
              borderRadius: 8, whiteSpace: 'nowrap', transition: 'opacity 0.15s',
            }}
            onMouseOver={e => (e.currentTarget.style.opacity = '0.7')}
            onMouseOut={e => (e.currentTarget.style.opacity = '1')}
          >
            ← Novu
          </button>

          <div
            className="hidden sm:flex"
            style={{
              alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 999,
              background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
              color: currentStatus.color, fontSize: '0.7rem', whiteSpace: 'nowrap',
            }}
          >
            <div style={{
              width: 6, height: 6, borderRadius: '50%', background: currentStatus.color,
              boxShadow: userStatus === 'connected' ? `0 0 6px ${currentStatus.color}` : 'none', flexShrink: 0,
            }} />
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
        <div className="hidden md:flex" style={{
          alignItems: 'center', gap: 16, fontSize: '0.75rem', color: 'var(--color-text-muted)',
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        }}>
          <span><strong style={{ color: 'var(--color-text)' }}>{onlineCount}</strong> online</span>
          <span><strong style={{ color: 'var(--color-text)' }}>{chattingCount}</strong> chatting</span>
        </div>

        {/* Right: controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {!isMobile && (
            <div style={{
              display: 'flex', gap: 2, padding: 3, borderRadius: 8,
              background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
            }}>
              {(['split', 'video-focus', 'chat-focus'] as Layout[]).map(l => (
                <button key={l} onClick={() => setLayout(l)} title={l.replace(/-/g, ' ')} style={{
                  padding: '3px 8px', borderRadius: 6,
                  background: layout === l ? 'var(--color-surface-3)' : 'transparent',
                  color: layout === l ? 'var(--color-text)' : 'var(--color-text-muted)',
                  border: 'none', cursor: 'pointer', fontSize: '0.75rem', transition: 'all 0.15s',
                }}>
                  {l === 'split' ? '⊡' : l === 'video-focus' ? '□' : '☰'}
                </button>
              ))}
            </div>
          )}

          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme" style={{
            padding: '5px 10px', borderRadius: 8, background: 'transparent',
            border: '1px solid var(--color-border)', color: 'var(--color-text-muted)',
            cursor: 'pointer', fontSize: '0.8rem', lineHeight: 1,
          }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {userStatus === 'connected' && !isMobile && (
            <>
              <button onClick={nextChat} className="btn-ghost" style={{ fontSize: '0.75rem', padding: '5px 12px' }}>⏭ Next</button>
              <button onClick={disconnect} className="btn-danger" style={{ fontSize: '0.75rem', padding: '5px 12px' }}>✕ Stop</button>
            </>
          )}

          {(userStatus === 'idle' || userStatus === 'disconnected') && (
            <button onClick={startChat} className="btn-primary" style={{ fontSize: '0.75rem', padding: '6px 14px' }}>
              🔍 {isMobile ? 'Find' : 'Find Stranger'}
            </button>
          )}

          {/* User avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 2 }}>
            {user.photoURL ? (
              <img
                src={user.photoURL} alt={displayName} referrerPolicy="no-referrer"
                style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', border: '1px solid var(--color-border)' }}
                title={displayName}
                onClick={handleGoHome}
              />
            ) : (
              <div
                onClick={handleGoHome}
                title={displayName}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--color-accent)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
                  border: '1px solid var(--color-border)',
                }}
              >
                {displayName.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {isMobile ? (
          <MobileLayout webrtc={webrtc} onSendMessage={sendMessage} onTyping={notifyTyping} onNext={nextChat} onDisconnect={disconnect} connectionStatus={connectionStatus} />
        ) : (
          <DesktopLayout layout={layout} webrtc={webrtc} onSendMessage={sendMessage} onTyping={notifyTyping} onNext={nextChat} onDisconnect={disconnect} connectionStatus={connectionStatus} />
        )}
      </main>

      {userStatus === 'waiting' && <WaitingOverlay onCancel={disconnect} count={waitingCount} />}
    </div>
  );
}

// ─── Desktop Layout ──────────────────────────────────────────────────────────
function DesktopLayout({ layout, webrtc, onSendMessage, onTyping, onNext, onDisconnect, connectionStatus }: {
  layout: Layout; webrtc: ReturnType<typeof useChat>['webrtc'];
  onSendMessage: (m: string) => void; onTyping: () => void;
  onNext: () => void; onDisconnect: () => void; connectionStatus: ConnectionStatus;
}) {
  const panelStyle: React.CSSProperties = { width: '100%', height: '100%', overflow: 'hidden' };

  if (layout === 'video-focus') return (
    <div style={panelStyle}>
      <VideoPanel localStream={webrtc.localStream} remoteStream={webrtc.remoteStream} connectionStatus={connectionStatus} videoEnabled={webrtc.videoEnabled} audioEnabled={webrtc.audioEnabled} mediaError={webrtc.mediaError} onToggleVideo={webrtc.toggleVideo} onToggleAudio={webrtc.toggleAudio} />
    </div>
  );

  if (layout === 'chat-focus') return (
    <div style={panelStyle}>
      <ChatPanel onSendMessage={onSendMessage} onTyping={onTyping} onNext={onNext} onDisconnect={onDisconnect} />
    </div>
  );

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
      <div style={{ flex: '0 0 60%', minWidth: 0, borderRight: '1px solid var(--color-border)', overflow: 'hidden' }}>
        <VideoPanel localStream={webrtc.localStream} remoteStream={webrtc.remoteStream} connectionStatus={connectionStatus} videoEnabled={webrtc.videoEnabled} audioEnabled={webrtc.audioEnabled} mediaError={webrtc.mediaError} onToggleVideo={webrtc.toggleVideo} onToggleAudio={webrtc.toggleAudio} />
      </div>
      <div style={{ flex: '1 1 40%', minWidth: 0, overflow: 'hidden' }}>
        <ChatPanel onSendMessage={onSendMessage} onTyping={onTyping} onNext={onNext} onDisconnect={onDisconnect} />
      </div>
    </div>
  );
}

// ─── Mobile Layout ───────────────────────────────────────────────────────────
function MobileLayout({ webrtc, onSendMessage, onTyping, onNext, onDisconnect, connectionStatus }: {
  webrtc: ReturnType<typeof useChat>['webrtc'];
  onSendMessage: (m: string) => void; onTyping: () => void;
  onNext: () => void; onDisconnect: () => void; connectionStatus: ConnectionStatus;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ flexShrink: 0, height: 260, borderBottom: '1px solid var(--color-border)', overflow: 'hidden' }}>
        <VideoPanel localStream={webrtc.localStream} remoteStream={webrtc.remoteStream} connectionStatus={connectionStatus} videoEnabled={webrtc.videoEnabled} audioEnabled={webrtc.audioEnabled} mediaError={webrtc.mediaError} onToggleVideo={webrtc.toggleVideo} onToggleAudio={webrtc.toggleAudio} />
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <ChatPanel onSendMessage={onSendMessage} onTyping={onTyping} onNext={onNext} onDisconnect={onDisconnect} />
      </div>
    </div>
  );
}

// ─── Waiting Overlay ─────────────────────────────────────────────────────────
function WaitingOverlay({ onCancel, count }: { onCancel: () => void; count: number }) {
  const [dots, setDots] = useState('');
  useEffect(() => {
    const interval = setInterval(() => setDots(prev => prev.length >= 3 ? '' : prev + '.'), 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 50, background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(16px)' }}>
      <div className="glass-card" style={{ borderRadius: 24, padding: 32, textAlign: 'center', maxWidth: 340, width: '100%', margin: '0 16px', animation: 'slideUp 0.3s ease forwards' }}>
        <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 24px' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: '2px solid var(--color-accent)',
              opacity: 1 - i * 0.25,
              animation: `pulseSoft ${1.5 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
              transform: `scale(${1 + i * 0.3})`,
            }} />
          ))}
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--color-surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🔍</div>
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: 8 }}>
          Finding a stranger{dots}
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: 24 }}>
          {count > 1 ? `${count} others in queue` : "You're up next!"}
        </p>
        <button onClick={onCancel} className="btn-ghost" style={{ width: '100%' }}>Cancel</button>
      </div>
    </div>
  );
}
