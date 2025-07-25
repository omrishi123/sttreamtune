
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { PlayerProvider } from '@/context/player-context';
import { LayoutProvider } from '@/components/layout-provider';
import { UserDataProvider } from '@/context/user-data-context';

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0096ff" />
        <link rel="icon" href="https://i.ibb.co/jDDgN4r/logo.png?v=2" type="image/png" />
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
      <body className="font-body antialiased dark">
        <LayoutProvider>{children}</LayoutProvider>
        <Toaster />
      </body>
    </html>
  );
}
