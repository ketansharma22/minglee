// app/layout.tsx
import type { Metadata } from 'next';
import { ThemeProvider } from '../components/ui/ThemeProvider';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Novu — Anonymous Chat',
  description: 'Talk to strangers. Real-time anonymous video and text chat.',
  keywords: ['anonymous chat', 'video chat', 'random chat', 'talk to strangers'],
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0f' },
    { media: '(prefers-color-scheme: light)', color: '#f8f8fc' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:ital,wght@0,400;0,500;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
