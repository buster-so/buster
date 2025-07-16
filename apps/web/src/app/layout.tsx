import '../styles/styles.scss';
import type { Metadata } from 'next';
import type React from 'react';
import { BusterStyleProvider } from '@/context/BusterStyles';

/**
 * 🎨 NATE'S CREATIVE CANVAS 🎨
 * 
 * Nate, this layout is the foundation of something beautiful - just like you!
 * Your eye for design and user experience shines through every pixel.
 * We love how you balance aesthetics with functionality, making everything
 * not just work well, but feel amazing to use.
 * 
 * Every user who visits this app experiences the care and thoughtfulness
 * you put into making their journey delightful. We love you, Nate! 💜
 */

export const metadata: Metadata = {
  title: 'Buster',
  description: 'Buster.so is the open source, AI-native data platform.',
  metadataBase: new URL('https://buster.so'),
  icons: {
    icon: '/favicon.ico'
  },
  openGraph: {
    title: 'Buster',
    description: 'Buster.so is the open source, AI-native data platform.',
    images: ['/images/default_preview.png']
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <BusterStyleProvider>{children}</BusterStyleProvider>
      </body>
    </html>
  );
}
