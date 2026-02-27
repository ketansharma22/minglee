// components/video/VideoPanel.tsx
'use client';

import { useRef, useEffect, useState } from 'react';
import type { ConnectionStatus } from '../../types';

interface VideoPanelProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  connectionStatus: ConnectionStatus;
  videoEnabled: boolean;
  audioEnabled: boolean;
  mediaError: string | null;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
}

export function VideoPanel({ localStream, remoteStream, connectionStatus, videoEnabled, audioEnabled, mediaError, onToggleVideo, onToggleAudio }: VideoPanelProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  const revealControls = () => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (remoteStream) {
      hideTimer.current = setTimeout(() => setShowControls(false), 3000);
    }
  };

  const statusMap: Record<ConnectionStatus, { label: string; color: string }> = {
    idle:         { label: 'Waiting…',         color: 'var(--color-text-muted)' },
    connecting:   { label: 'Connecting…',       color: 'var(--color-warning)' },
    connected:    { label: 'Live',              color: 'var(--color-success)' },
    failed:       { label: 'Failed',            color: 'var(--color-danger)' },
    reconnecting: { label: 'Reconnecting…',     color: 'var(--color-warning)' },
  };
  const status = statusMap[connectionStatus];

  return (
    <div
      style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)', position: 'relative', overflow: 'hidden' }}
      onMouseMove={revealControls}
      onMouseEnter={revealControls}
    >
      {/* Remote video */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
            background: 'var(--color-bg)',
          }}>
            {connectionStatus === 'connecting' || connectionStatus === 'reconnecting' ? (
              <>
                <div className="spinner" style={{ width: 32, height: 32 }} />
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
                  {status.label}
                </span>
              </>
            ) : connectionStatus === 'failed' ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8, opacity: 0.4 }}>⚡</div>
                <p style={{ color: 'var(--color-danger)', fontSize: '0.82rem', marginBottom: 4 }}>Connection failed</p>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>Text chat still works</p>
              </div>
            ) : (
              /* Idle/waiting state */
              <div style={{ textAlign: 'center', opacity: 0.5 }}>
                {/* Decorative avatar */}
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  border: '1.5px dashed var(--color-text-dim)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 14px',
                  animation: 'pulseSoft 3s ease-in-out infinite',
                }}>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <circle cx="14" cy="10" r="5" stroke="var(--color-text-muted)" strokeWidth="1.5"/>
                    <path d="M6 23c0-4 3.6-7 8-7s8 3 8 7" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>
                  Waiting for stranger…
                </p>
              </div>
            )}
          </div>
        )}

        {/* Status badge overlay */}
        <div style={{
          position: 'absolute', top: 12, left: 12,
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 10px', borderRadius: 100,
          background: 'rgba(6,6,8,0.72)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.07)',
          transition: 'opacity 0.3s',
          opacity: showControls ? 1 : 0,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: status.color, flexShrink: 0,
            boxShadow: connectionStatus === 'connected' ? `0 0 6px ${status.color}` : undefined,
          }} />
          <span style={{ fontSize: '0.68rem', color: status.color, fontWeight: 500, fontFamily: 'var(--font-mono)' }}>
            {status.label}
          </span>
        </div>

        {/* PiP local video */}
        <div style={{
          position: 'absolute', bottom: 12, right: 12,
          width: 120, height: 80, borderRadius: 12, overflow: 'hidden',
          background: 'var(--color-surface-3)',
          border: '1.5px solid rgba(255,255,255,0.1)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          transition: 'opacity 0.3s',
          opacity: showControls ? 1 : (remoteStream ? 0.4 : 1),
        }}>
          {localStream && videoEnabled ? (
            <video
              ref={localVideoRef}
              autoPlay playsInline muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--color-surface-3)',
            }}>
              {mediaError
                ? <span style={{ fontSize: '1.2rem', opacity: 0.5 }}>📷</span>
                : !videoEnabled
                ? <span style={{ fontSize: '1.2rem', opacity: 0.5 }}>🚫</span>
                : <div className="spinner" style={{ width: 16, height: 16 }} />
              }
            </div>
          )}
          {/* "You" label */}
          <div style={{
            position: 'absolute', bottom: 4, left: 6,
            fontSize: '0.58rem', color: 'rgba(255,255,255,0.7)',
            fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
            textTransform: 'uppercase',
            background: 'rgba(0,0,0,0.5)', padding: '1px 5px', borderRadius: 4,
          }}>
            YOU
          </div>
        </div>
      </div>

      {/* Controls bar */}
      <div style={{
        flexShrink: 0, padding: '10px 14px',
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', gap: 8,
        transition: 'opacity 0.3s',
      }}>
        {mediaError ? (
          <div style={{
            flex: 1, padding: '8px 12px', borderRadius: 10,
            background: 'rgba(255,68,102,0.06)',
            border: '1px solid rgba(255,68,102,0.12)',
            fontSize: '0.72rem', color: 'var(--color-text-muted)', lineHeight: 1.4,
          }}>
            {mediaError}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <ControlBtn
              onClick={onToggleVideo}
              active={videoEnabled}
              activeIcon="📹" inactiveIcon="📷"
              label={videoEnabled ? 'Disable camera' : 'Enable camera'}
            />
            <ControlBtn
              onClick={onToggleAudio}
              active={audioEnabled}
              activeIcon="🎤" inactiveIcon="🔇"
              label={audioEnabled ? 'Mute mic' : 'Unmute mic'}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ControlBtn({ onClick, active, activeIcon, inactiveIcon, label }: {
  onClick: () => void; active: boolean; activeIcon: string; inactiveIcon: string; label: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 40, height: 40, borderRadius: 10,
        border: `1px solid ${active ? 'var(--color-border)' : 'rgba(255,68,102,0.2)'}`,
        background: active
          ? (hovered ? 'var(--color-surface-3)' : 'var(--color-surface-2)')
          : 'rgba(255,68,102,0.1)',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1rem',
        transition: 'all 0.15s',
        transform: hovered ? 'scale(1.06)' : 'scale(1)',
      }}
    >
      {active ? activeIcon : inactiveIcon}
    </button>
  );
}
