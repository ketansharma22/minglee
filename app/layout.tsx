import type { Metadata } from 'next';
import { ThemeProvider } from '../components/ui/ThemeProvider';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Mingle — Meet Strangers Anonymously',
  description: 'Video and text chat with random people worldwide. No sign-up. Just click and connect.',
  keywords: ['anonymous chat', 'video chat', 'random chat', 'meet strangers', 'mingle'],
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#060608' },
    { media: '(prefers-color-scheme: light)', color: '#f0f0f6' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=IBM+Plex+Mono:wght@400;500&display=swap"
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
