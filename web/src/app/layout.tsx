import type { Metadata } from 'next';
import type React from 'react';
import { BusterStyleProvider } from '@/context/BusterStyles';
import '../styles/styles.scss';

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
