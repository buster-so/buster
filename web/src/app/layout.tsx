import type { Metadata } from 'next';
import React from 'react';
import '../styles/styles.scss';

import { BusterStyleProvider } from '@/context/BusterStyles/BusterStyles';
import { GlobalErrorComponent } from '../components/error/GlobalErrorComponent';

export const metadata: Metadata = {
  title: 'Buster',
  description: 'Buster.so is the open source, AI-native data platform.',
  icons: {
    icon: '/favicon.ico'
  },
  openGraph: {
    title: 'Buster',
    description: 'Buster.so is the open source, AI-native data platform.',
    images: ['/images/default_preview.png']
  }
};

export default async function RootLayout({
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
