'use client';

import type React from 'react';
import { ChatLayout } from '@/layouts/ChatLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ChatLayout>{children}</ChatLayout>;
}
