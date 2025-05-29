'use client';

import { ChatLayout } from '@/layouts/ChatLayout';
import type React from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ChatLayout>{children}</ChatLayout>;
}
