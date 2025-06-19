import type React from 'react';
import { SidebarSettings } from '@/components/features/sidebars/SidebarSettings';
import { AppLayout } from '@/components/ui/layouts/AppLayout';

export default async function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout sidebar={<SidebarSettings />} autoSaveId="settings-layout">
      {children}
    </AppLayout>
  );
}
