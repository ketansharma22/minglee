// app/auth/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } from '../../lib/firebase/auth';
import { useAuthStore } from '../../lib/store/authStore';
import { useChatStore } from '../../lib/store/chatStore';

type AuthMode = 'login' | 'signup' | 'reset';

export default function AuthPage() {
  const router = useRouter();
  const { user, loading, initialized } = useAuthStore();
  const { theme, setTheme } = useChatStore();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (initialized && user) router.replace('/');
  }, [user, initialized, router]);

  const clearMessages = () => { setError(''); setInfo(''); };

  const friendlyError = (code: string) => {
    const map: Record<string, string> = {
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
      'auth/network-request-failed': 'Network error. Check your connection.',
      'auth/too-many-requests': 'Too many attempts. Try again later.',
      'auth/invalid-credential': 'Invalid email or password.',
    };
    return map[code] || 'Something went wrong. Please try again.';
  };

  const handleGoogleSignIn = async () => {
    clearMessages();
    setSubmitting(true);
    try {
      await signInWithGoogle();
      router.replace('/');
    } catch (err: unknown) {
      const e = err as { code?: string };
      setError(friendlyError(e.code || ''));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (mode === 'signup') {
      if (!displayName.trim()) { setError('Please enter your name.'); return; }
      if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
      if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    }

    if (mode === 'reset') {
      setSubmitting(true);
      try {
        await resetPassword(email);
        setInfo('Password reset email sent. Check your inbox.');
        setMode('login');
      } catch (err: unknown) {
        const e = err as { code?: string };
        setError(friendlyError(e.code || ''));
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, displayName.trim());
      }
      router.replace('/');
    } catch (err: unknown) {
      const e = err as { code?: string };
      setError(friendlyError(e.code || ''));
    } finally {
      setSubmitting(false);
    }
  };

  if (!initialized || (initialized && user)) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  const titles = { login: 'Welcome back', signup: 'Create account', reset: 'Reset password' };
  const subtitles = {
    login: 'Sign in to start chatting anonymously',
    signup: 'Join Novu and meet strangers worldwide',
    reset: 'We\'ll send a reset link to your email',
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        background: 'var(--color-bg)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glow */}
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(108,99,255,0.08) 0%, transparent 70%)',
        top: '50%', left: '50%', transform: 'translate(-50%, -60%)', pointerEvents: 'none',
      }} />

      {/* Theme toggle */}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        style={{
          position: 'absolute', top: 16, right: 16,
          padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          color: 'var(--color-text-muted)', fontSize: '0.875rem',
        }}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 420,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 24,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-glow), var(--shadow-card)',
        animation: 'slideUp 0.4s ease forwards',
        position: 'relative', zIndex: 5,
      }}>
        {/* Header */}
        <div style={{
          padding: '28px 28px 24px',
          borderBottom: '1px solid var(--color-border)',
          background: 'linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-2) 100%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'var(--color-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem', boxShadow: '0 4px 16px rgba(108,99,255,0.4)',
            }}>
              ✨
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4rem', color: 'var(--color-text)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                Novu
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 2 }}>Anonymous Chat</div>
            </div>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>
            {titles[mode]}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.825rem' }}>
            {subtitles[mode]}
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Error / Info banners */}
          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 10, fontSize: '0.8rem', lineHeight: 1.4,
              background: 'rgba(232,64,64,0.08)', color: 'var(--color-danger)',
              border: '1px solid rgba(232,64,64,0.2)',
              animation: 'fadeIn 0.2s ease',
            }}>
              ⚠️ {error}
            </div>
          )}
          {info && (
            <div style={{
              padding: '10px 14px', borderRadius: 10, fontSize: '0.8rem', lineHeight: 1.4,
              background: 'rgba(58,158,114,0.08)', color: 'var(--color-success)',
              border: '1px solid rgba(58,158,114,0.2)',
              animation: 'fadeIn 0.2s ease',
            }}>
              ✓ {info}
            </div>
          )}

          {/* Google Button */}
          {mode !== 'reset' && (
            <>
              <button
                onClick={handleGoogleSignIn}
                disabled={submitting}
                style={{
                  width: '100%', padding: '11px 16px',
                  borderRadius: 12, cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                  fontSize: '0.875rem', fontWeight: 500,
                  transition: 'all 0.15s',
                  opacity: submitting ? 0.6 : 1,
                  fontFamily: 'var(--font-body)',
                }}
                onMouseOver={e => { if (!submitting) (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-accent)'; }}
                onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)'; }}
              >
                <GoogleIcon />
                Continue with Google
              </button>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>or</span>
                <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
              </div>
            </>
          )}

          {/* Email Form */}
          <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mode === 'signup' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 6 }}>
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="How should we call you?"
                  className="input-field"
                  style={{ fontSize: '0.875rem' }}
                  required
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 6 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-field"
                style={{ fontSize: '0.875rem' }}
                required
                autoComplete="email"
              />
            </div>

            {mode !== 'reset' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 6 }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="input-field"
                    style={{ fontSize: '0.875rem', paddingRight: 44 }}
                    required
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: 1,
                    }}
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 6 }}>
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="input-field"
                  style={{ fontSize: '0.875rem' }}
                  required
                  autoComplete="new-password"
                />
              </div>
            )}

            {mode === 'login' && (
              <button
                type="button"
                onClick={() => { setMode('reset'); clearMessages(); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-accent)', fontSize: '0.78rem', textAlign: 'right', fontFamily: 'var(--font-body)' }}
              >
                Forgot password?
              </button>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{ width: '100%', padding: '12px', borderRadius: 12, fontSize: '0.9rem', opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer', marginTop: 4 }}
            >
              {submitting ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                  <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  {mode === 'login' ? 'Signing in...' : mode === 'signup' ? 'Creating account...' : 'Sending...'}
                </span>
              ) : (
                mode === 'login' ? '→ Sign In' : mode === 'signup' ? '→ Create Account' : '→ Send Reset Email'
              )}
            </button>
          </form>

          {/* Mode switch */}
          <div style={{ textAlign: 'center', paddingTop: 4 }}>
            {mode === 'login' && (
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Don&apos;t have an account?{' '}
                <button onClick={() => { setMode('signup'); clearMessages(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-accent)', fontWeight: 600, fontFamily: 'var(--font-body)', fontSize: '0.8rem' }}>
                  Sign up
                </button>
              </p>
            )}
            {mode === 'signup' && (
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Already have an account?{' '}
                <button onClick={() => { setMode('login'); clearMessages(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-accent)', fontWeight: 600, fontFamily: 'var(--font-body)', fontSize: '0.8rem' }}>
                  Sign in
                </button>
              </p>
            )}
            {mode === 'reset' && (
              <button onClick={() => { setMode('login'); clearMessages(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', fontSize: '0.8rem' }}>
                ← Back to sign in
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <p style={{ marginTop: 24, color: 'var(--color-text-muted)', fontSize: '0.7rem', textAlign: 'center', opacity: 0.6 }}>
        By continuing, you agree to be respectful. Harmful content is strictly prohibited.
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}
