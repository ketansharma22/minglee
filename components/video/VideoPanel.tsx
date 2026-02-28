// components/video/VideoPanel.tsx
'use client';

import { useRef, useEffect } from 'react';
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

export function VideoPanel({
  localStream,
  remoteStream,
  connectionStatus,
  videoEnabled,
  audioEnabled,
  mediaError,
  onToggleVideo,
  onToggleAudio,
}: VideoPanelProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const statusLabel: Record<ConnectionStatus, string> = {
    idle: 'Waiting...',
    connecting: 'Connecting...',
    connected: 'Connected',
    failed: 'Connection failed',
    reconnecting: 'Reconnecting...',
  };

  const statusColor: Record<ConnectionStatus, string> = {
    idle: 'var(--color-text-muted)',
    connecting: 'var(--color-warning)',
    connected: 'var(--color-success)',
    failed: 'var(--color-danger)',
    reconnecting: 'var(--color-warning)',
  };

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--color-surface)' }}>
      {/* Remote video (main) */}
      <div
        className="relative flex-1 overflow-hidden"
        style={{ background: 'var(--color-bg)', minHeight: 0 }}
      >
        {remoteStream && connectionStatus === 'connected' ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4">
            {connectionStatus === 'connecting' || connectionStatus === 'reconnecting' ? (
              <>
                <div className="spinner" style={{ width: 36, height: 36 }} />
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                  {statusLabel[connectionStatus]}
                </p>
              </>
            ) : connectionStatus === 'failed' ? (
              <div className="flex flex-col items-center gap-2">
                <div style={{ fontSize: '2rem' }}>⚡</div>
                <p style={{ color: 'var(--color-danger)', fontSize: '0.875rem' }}>Connection failed</p>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Text chat still available</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'var(--color-surface-3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                  }}
                >
                  👤
                </div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                  Waiting for stranger...
                </p>
              </div>
            )}
          </div>
        )}

        {/* Connection status badge */}
        <div
          className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            color: statusColor[connectionStatus],
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: statusColor[connectionStatus],
              boxShadow: connectionStatus === 'connected' ? `0 0 6px ${statusColor[connectionStatus]}` : 'none',
            }}
          />
          {statusLabel[connectionStatus]}
        </div>
      </div>

      {/* Local video (PiP) + controls */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
          background: 'var(--color-surface-2)',
          borderTop: '1px solid var(--color-border)',
          minHeight: 72,
        }}
      >
        {/* Local video thumbnail */}
        <div
          style={{
            position: 'relative',
            width: 110,
            height: 68,
            borderRadius: 10,
            overflow: 'hidden',
            flexShrink: 0,
            background: 'var(--color-surface-3)',
            border: '1px solid var(--color-border)',
          }}
        >
          {localStream && videoEnabled ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {mediaError
                ? <span style={{ fontSize: '1.1rem' }}>📷</span>
                : !videoEnabled
                ? <span style={{ fontSize: '1.1rem' }}>🚫</span>
                : <div className="spinner" style={{ width: 16, height: 16 }} />
              }
            </div>
          )}
          {/* "You" label */}
          <div
            style={{
              position: 'absolute',
              bottom: 3,
              left: 4,
              padding: '1px 5px',
              borderRadius: 4,
              background: 'rgba(0,0,0,0.65)',
              color: 'rgba(255,255,255,0.85)',
              fontSize: '0.6rem',
              letterSpacing: '0.02em',
            }}
          >
            You
          </div>
        </div>

        {/* Media error message */}
        {mediaError && (
          <div
            style={{
              flex: 1,
              fontSize: '0.7rem',
              lineHeight: 1.4,
              padding: '6px 10px',
              borderRadius: 8,
              background: 'rgba(255,87,87,0.07)',
              color: 'var(--color-text-muted)',
              border: '1px solid rgba(255,87,87,0.15)',
            }}
          >
            {mediaError}
          </div>
        )}

        {/* Controls */}
        {!mediaError && (
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            <ControlButton
              onClick={onToggleVideo}
              active={videoEnabled}
              icon={videoEnabled ? '📹' : '📷'}
              label={videoEnabled ? 'Disable video' : 'Enable video'}
            />
            <ControlButton
              onClick={onToggleAudio}
              active={audioEnabled}
              icon={audioEnabled ? '🎤' : '🔇'}
              label={audioEnabled ? 'Mute' : 'Unmute'}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ControlButton({
  onClick,
  active,
  icon,
  label,
}: {
  onClick: () => void;
  active: boolean;
  icon: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex items-center justify-center rounded-xl text-lg transition-all duration-200"
      style={{
        width: 44,
        height: 44,
        background: active ? 'var(--color-surface-3)' : 'rgba(255,87,87,0.15)',
        border: `1px solid ${active ? 'var(--color-border)' : 'rgba(255,87,87,0.2)'}`,
        cursor: 'pointer',
      }}
      onMouseOver={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
      }}
      onMouseOut={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
      }}
    >
      {icon}
    </button>
  );
}
