import type React from 'react';
import { SidebarPrimary } from '@/components/features/sidebars/SidebarPrimary';
import { AppLayout } from '@/components/ui/layouts/AppLayout';

export default async function Layout({ children }: { children: React.ReactNode }) {
  return <AppLayout sidebar={<SidebarPrimary />}>{children}</AppLayout>;
}
