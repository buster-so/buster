import type React from 'react';
import { SidebarSettings } from '@/components/features/sidebars/SidebarSettings';
import { AppLayout } from '@/components/ui/layouts/AppLayout';
import { getAppSplitterLayout } from '@/components/ui/layouts/AppSplitter';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const defaultLayout = await getAppSplitterLayout('app-layout');

  return (
    <AppLayout defaultLayout={defaultLayout} sidebar={<SidebarSettings />}>
      {children}
    </AppLayout>
  );
}
