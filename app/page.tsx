// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/lib/store/chatStore';

const INTERESTS = [
  'music', 'gaming', 'art', 'coding', 'travel',
  'movies', 'books', 'sports', 'anime', 'cooking',
  'photography', 'science', 'design', 'fitness', 'crypto',
];

export default function HomePage() {
  const router = useRouter();
  const { setInterests, interests, setTheme, theme, onlineCount, chattingCount } = useChatStore();
  const [inputInterest, setInputInterest] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const addInterest = (val: string) => {
    const clean = val.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    if (!clean || interests.includes(clean) || interests.length >= 10) return;
    setInterests([...interests, clean]);
    setInputInterest('');
  };

  const removeInterest = (v: string) => setInterests(interests.filter(i => i !== v));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addInterest(inputInterest); }
    if (e.key === 'Backspace' && !inputInterest && interests.length) {
      removeInterest(interests[interests.length - 1]);
    }
  };

  return (
    <main
      className="min-h-dvh flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Grid background */}
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: `
            linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          animation: 'gridPulse 6s ease-in-out infinite',
        }}
      />

      {/* Glow orbs */}
      <div aria-hidden style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 60% 50% at 20% 40%, rgba(0,229,255,0.04) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 80% 70%, rgba(124,58,237,0.05) 0%, transparent 60%)',
      }} />

      {/* Top bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid var(--color-border)',
        background: 'rgba(6,6,8,0.8)',
        backdropFilter: 'blur(16px)',
      }}>
        {/* Logo mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'var(--color-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px var(--color-accent-glow)',
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="4" cy="4" r="2.5" fill="#000" />
              <circle cx="10" cy="4" r="2.5" fill="#000" />
              <path d="M2 9.5C2 8 5 7 7 7C9 7 12 8 12 9.5" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: '1rem', color: 'var(--color-text)',
            letterSpacing: '-0.02em',
          }}>Mingle</span>
        </div>

        {/* Live stats */}
        {mounted && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--color-success)',
                boxShadow: '0 0 6px var(--color-success)',
                display: 'inline-block',
              }} />
              <strong style={{ color: 'var(--color-text)', fontVariantNumeric: 'tabular-nums' }}>
                {onlineCount.toLocaleString()}
              </strong> online
            </div>
            <div style={{ width: 1, height: 14, background: 'var(--color-border)' }} />
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              <strong style={{ color: 'var(--color-text)' }}>{chattingCount}</strong> chatting
            </div>
          </div>
        )}

        {/* Theme */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="btn-ghost"
          style={{ padding: '6px 10px', fontSize: '0.8rem' }}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀︎' : '☾'}
        </button>
      </div>

      {/* Main content */}
      <div
        style={{
          position: 'relative', zIndex: 1,
          width: '100%', maxWidth: 440,
          animation: mounted ? 'slideUp 0.5s ease forwards' : undefined,
          opacity: mounted ? undefined : 0,
        }}
      >
        {/* Hero text */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '5px 14px', borderRadius: 100,
            background: 'var(--color-accent-soft)',
            border: '1px solid var(--color-border-accent)',
            marginBottom: 20,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-accent)', display: 'inline-block', boxShadow: '0 0 8px var(--color-accent)' }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--color-accent)', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Live · No sign-up needed
            </span>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 6vw, 2.8rem)',
            fontWeight: 700,
            color: 'var(--color-text)',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            marginBottom: 12,
          }}>
            Meet someone<br />
            <span style={{ color: 'var(--color-accent)', position: 'relative' }}>
              unexpected
              <span style={{
                position: 'absolute', bottom: -2, left: 0, right: 0, height: 2,
                background: 'linear-gradient(90deg, var(--color-accent), transparent)',
                borderRadius: 1,
              }} />
            </span>
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: 320, margin: '0 auto' }}>
            Anonymous video and text chat with strangers worldwide. No account, no trace.
          </p>
        </div>

        {/* Card */}
        <div
          className="glass-card"
          style={{ borderRadius: 20, overflow: 'hidden' }}
        >
          {/* Interests section */}
          <div style={{ padding: '24px 24px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Interests
              </label>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                {interests.length}/10 · optional
              </span>
            </div>

            {/* Combined input + tags box */}
            <div
              style={{
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                borderRadius: 12,
                padding: '10px 12px',
                minHeight: 48,
                display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
                cursor: 'text',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onClick={() => document.getElementById('interest-input')?.focus()}
            >
              {interests.map(tag => (
                <span
                  key={tag}
                  onClick={(e) => { e.stopPropagation(); removeInterest(tag); }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '2px 10px', borderRadius: 100,
                    background: 'var(--color-accent-soft)',
                    border: '1px solid var(--color-border-accent)',
                    color: 'var(--color-accent)',
                    fontSize: '0.72rem', fontWeight: 500,
                    cursor: 'pointer', userSelect: 'none',
                    transition: 'opacity 0.15s',
                  }}
                  onMouseOver={e => (e.currentTarget.style.opacity = '0.7')}
                  onMouseOut={e => (e.currentTarget.style.opacity = '1')}
                >
                  {tag}
                  <span style={{ fontSize: '0.9em', opacity: 0.6 }}>×</span>
                </span>
              ))}
              <input
                id="interest-input"
                type="text"
                value={inputInterest}
                onChange={e => setInputInterest(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={interests.length === 0 ? 'gaming, music, art… (press Enter)' : ''}
                style={{
                  flex: 1, minWidth: 120, background: 'transparent',
                  border: 'none', outline: 'none',
                  color: 'var(--color-text)', fontSize: '0.82rem',
                  fontFamily: 'var(--font-body)',
                }}
              />
            </div>

            {/* Suggestions */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {INTERESTS.filter(s => !interests.includes(s)).slice(0, 9).map(s => (
                <button
                  key={s}
                  onClick={() => addInterest(s)}
                  style={{
                    padding: '3px 10px', borderRadius: 100,
                    background: 'transparent',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-muted)',
                    fontSize: '0.72rem', cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'var(--font-body)',
                  }}
                  onMouseOver={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-accent)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-accent)';
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-accent-soft)';
                  }}
                  onMouseOut={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)';
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  }}
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--color-border)', margin: '20px 0 0' }} />

          {/* Mode selector */}
          <div style={{ padding: '16px 24px 0' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: 8,
            }}>
              {[
                { icon: '⬡', label: 'Video + Text', sub: 'Full experience', active: true },
                { icon: '◻', label: 'Text Only', sub: 'No camera needed', active: false },
              ].map((mode) => (
                <div
                  key={mode.label}
                  style={{
                    padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                    border: `1px solid ${mode.active ? 'var(--color-border-accent)' : 'var(--color-border)'}`,
                    background: mode.active ? 'var(--color-accent-soft)' : 'var(--color-surface-2)',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: '1rem', marginBottom: 3, color: mode.active ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
                    {mode.icon}
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: mode.active ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                    {mode.label}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginTop: 1 }}>
                    {mode.sub}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{ padding: '16px 24px 20px' }}>
            <button
              onClick={() => router.push('/chat')}
              className="btn-primary"
              style={{ width: '100%', padding: '14px', borderRadius: 14, fontSize: '0.95rem', letterSpacing: '-0.01em' }}
            >
              <span style={{ fontSize: '1rem' }}>→</span>
              Start Mingling
            </button>
          </div>
        </div>

        {/* Footer note */}
        <p style={{
          textAlign: 'center', marginTop: 20,
          fontSize: '0.68rem', color: 'var(--color-text-dim)', lineHeight: 1.6,
        }}>
          By continuing you agree to be respectful to others.<br />
          Harmful or illegal content is not permitted.
        </p>
      </div>
    </main>
  );
}
