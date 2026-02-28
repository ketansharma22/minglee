// app/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center p-6"
      style={{ background: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: 'var(--font-body)' }}
    >
      <div className="text-center">
        <div style={{ fontSize: '4rem', marginBottom: 16, fontFamily: 'var(--font-mono)' }}>404</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', marginBottom: 8 }}>
          Page not found
        </h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 24, fontSize: '0.875rem' }}>
          This page doesn&apos;t exist.
        </p>
        <Link href="/" className="btn-primary">
          Go Home
        </Link>
      </div>
    </div>
  );
}
