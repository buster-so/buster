import React from 'react';
import { AppLayout } from '@/components/ui/layouts/AppLayout';
import { getAppSplitterLayout } from '@/components/ui/layouts/AppSplitter';
import { SidebarSettings } from '@/components/features/sidebars/SidebarSettings';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const defaultLayout = getAppSplitterLayout('app-layout');

  return (
    <AppLayout defaultLayout={defaultLayout} sidebar={<SidebarSettings />}>
      {children}
    </AppLayout>
  );
}
