import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { PlayerProvider } from '@/context/player-context';
import { LayoutProvider } from '@/components/layout-provider';

export const metadata: Metadata = {
  title: 'StreamTune',
  description: 'A modern, responsive music streaming application.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <PlayerProvider>
          <LayoutProvider>{children}</LayoutProvider>
        </PlayerProvider>
        <Toaster />
      </body>
    </html>
  );
}
