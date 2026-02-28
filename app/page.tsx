// app/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '../lib/store/chatStore';

const INTEREST_SUGGESTIONS = [
  'music', 'gaming', 'art', 'coding', 'travel',
  'movies', 'books', 'sports', 'anime', 'cooking',
  'photography', 'science', 'crypto', 'fitness', 'design',
];

export default function HomePage() {
  const router = useRouter();
  const { setInterests, interests, setTheme, theme, onlineCount, waitingCount, chattingCount } = useChatStore();
  const [inputInterest, setInputInterest] = useState('');

  const addInterest = (interest: string) => {
    const clean = interest.toLowerCase().trim();
    if (!clean || interests.includes(clean) || interests.length >= 10) return;
    setInterests([...interests, clean]);
    setInputInterest('');
  };

  const removeInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest));
  };

  const handleInterestKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addInterest(inputInterest);
    }
  };

  const handleStart = () => {
    router.push('/chat');
  };

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--color-bg)',
      }}
    >
      {/* Background orbs */}
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(108,99,255,0.08) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(76,175,132,0.06) 0%, transparent 70%)',
          bottom: '10%',
          right: '10%',
          pointerEvents: 'none',
        }}
      />

      {/* Theme toggle */}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        aria-label="Toggle theme"
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          padding: '6px 12px',
          borderRadius: 8,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
          fontSize: '0.875rem',
          lineHeight: 1,
          zIndex: 10,
        }}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      {/* Stats */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '6px 14px',
          borderRadius: 999,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-muted)',
          fontSize: '0.75rem',
          zIndex: 10,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--color-success)',
            boxShadow: '0 0 6px var(--color-success)',
            display: 'inline-block',
          }} />
          <strong style={{ color: 'var(--color-text)' }}>{onlineCount}</strong>
          <span>online</span>
        </span>
        <span style={{ opacity: 0.3 }}>|</span>
        <span>{chattingCount} chatting</span>
      </div>

      {/* Main card */}
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-glow), var(--shadow-card)',
          borderRadius: 24,
          overflow: 'hidden',
          animation: 'slideUp 0.5s ease forwards',
          position: 'relative',
          zIndex: 5,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '28px 28px 24px',
            borderBottom: '1px solid var(--color-border)',
            background: 'linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-2) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'var(--color-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                boxShadow: '0 4px 16px rgba(108,99,255,0.4)',
                flexShrink: 0,
              }}
            >
              ✨
            </div>
            <div>
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--color-text)',
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                }}
              >
                Novu
              </h1>
              <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                Anonymous chat
              </p>
            </div>
          </div>
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontSize: '0.875rem',
              lineHeight: 1.6,
            }}
          >
            Talk to strangers anonymously. No account required. Just click and chat.
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Interests */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                marginBottom: 8,
                color: 'var(--color-text)',
              }}
            >
              Interests
              <span style={{ marginLeft: 8, fontSize: '0.75rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>
                optional, for better matches
              </span>
            </label>

            {/* Tags */}
            {interests.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {interests.map(interest => (
                  <span
                    key={interest}
                    onClick={() => removeInterest(interest)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '3px 10px',
                      borderRadius: 999,
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      background: 'var(--color-accent-soft)',
                      color: 'var(--color-accent)',
                      border: '1px solid var(--color-accent-soft)',
                      cursor: 'pointer',
                      transition: 'opacity 0.15s',
                    }}
                  >
                    #{interest}
                    <span style={{ opacity: 0.6, fontSize: '0.9em' }}>×</span>
                  </span>
                ))}
              </div>
            )}

            <input
              type="text"
              value={inputInterest}
              onChange={e => setInputInterest(e.target.value)}
              onKeyDown={handleInterestKeyDown}
              placeholder="Add interest and press Enter..."
              className="input-field"
              style={{ fontSize: '0.875rem' }}
            />

            {/* Suggestions */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {INTEREST_SUGGESTIONS.filter(s => !interests.includes(s)).slice(0, 8).map(s => (
                <button
                  key={s}
                  onClick={() => addInterest(s)}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 999,
                    fontSize: '0.72rem',
                    background: 'var(--color-surface-2)',
                    color: 'var(--color-text-muted)',
                    border: '1px solid var(--color-border)',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s, color 0.15s',
                  }}
                  onMouseOver={e => {
                    const el = e.currentTarget as HTMLButtonElement;
                    el.style.borderColor = 'var(--color-accent)';
                    el.style.color = 'var(--color-accent)';
                  }}
                  onMouseOut={e => {
                    const el = e.currentTarget as HTMLButtonElement;
                    el.style.borderColor = 'var(--color-border)';
                    el.style.color = 'var(--color-text-muted)';
                  }}
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleStart}
            className="btn-primary"
            style={{ width: '100%', padding: '14px', borderRadius: 14, fontSize: '0.9375rem' }}
          >
            <span style={{ marginRight: 8 }}>⚡</span>
            Start Chatting
          </button>

          {/* Features */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 10,
              paddingTop: 6,
              borderTop: '1px solid var(--color-border)',
            }}
          >
            {[
              { icon: '🎥', label: 'Video Chat' },
              { icon: '💬', label: 'Text Chat' },
              { icon: '🔒', label: 'Anonymous' },
            ].map(({ icon, label }) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: '10px 0',
                  borderRadius: 12,
                  background: 'var(--color-surface-2)',
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{label}</span>
              </div>
            ))}
          </div>

          <p
            style={{
              textAlign: 'center',
              fontSize: '0.68rem',
              color: 'var(--color-text-muted)',
              lineHeight: 1.5,
              opacity: 0.8,
            }}
          >
            By using Novu, you agree to be respectful. Harmful content is strictly prohibited.
          </p>
        </div>
      </div>
    </main>
  );
}
