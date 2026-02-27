// app/error.tsx
'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center p-6"
      style={{ background: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: 'var(--font-body)' }}
    >
      <div className="text-center max-w-md">
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚡</div>
        <h2
          className="font-semibold mb-2"
          style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}
        >
          Something went wrong
        </h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 24, fontSize: '0.875rem' }}>
          {error.message || 'An unexpected error occurred.'}
        </p>
        <button onClick={reset} className="btn-primary">
          Try Again
        </button>
      </div>
    </div>
  );
}
