import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { LayoutProvider } from '@/components/layout-provider';
import { ThemeProvider } from '@/components/theme-provider';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'SttreamTune - Unlimited Music & AI Playlists',
  description: 'Stream any song from YouTube with SttreamTune. Experience the best free music streaming with AI-powered playlists, Your Supermix, and a premium UI. Discover Streamtune, Tunestream, and more.',
  keywords: ['sttreamtune', 'streamtune', 'tune stream', 'music streaming', 'free music', 'AI playlists', 'YouTube music player', 'offline music', 'SttreamTune App'],
  authors: [{ name: 'Om Rishi', url: 'https://instagram.com/omrishi07' }],
  verification: {
    google: 'QevZ0DEoeeFjs-ZVStT1cz-lGZKKzgbENyllLalIaDE',
  },
  openGraph: {
    title: 'SttreamTune - Your Vibe, Perfected',
    description: 'The ultimate music streaming experience. Unlimited songs, AI discovery, and premium glassmorphic UI.',
    url: 'https://sttreamtune.vercel.app',
    siteName: 'SttreamTune',
    images: [
      {
        url: 'https://i.postimg.cc/SswWC87w/streamtune.png',
        width: 800,
        height: 600,
        alt: 'SttreamTune Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SttreamTune - Music Streaming Redefined',
    description: 'Unlimited music and AI-driven discovery at your fingertips.',
    images: ['https://i.postimg.cc/SswWC87w/streamtune.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0096ff" />
        <link rel="icon" href="https://i.postimg.cc/SswWC87w/streamtune.png" type="image/png" />
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
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <LayoutProvider>{children}</LayoutProvider>
          <Toaster />
        </ThemeProvider>
         <Script src="https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1" />
      </body>
    </html>
  );
}
