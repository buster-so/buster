import type React from 'react';
import { SidebarPrimary } from '@/components/features/sidebars/SidebarPrimary';
import { AppLayout } from '@/components/ui/layouts/AppLayout';
import { getAppSplitterLayout } from '@/components/ui/layouts/AppSplitter';
import { DEFAULT_SIDEBAR_WIDTH } from '@/components/ui/sidebar/config';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const defaultLayout = await getAppSplitterLayout('app-layout', [DEFAULT_SIDEBAR_WIDTH, 'auto']);

  return (
    <AppLayout defaultLayout={defaultLayout} sidebar={<SidebarPrimary />}>
      {children}
    </AppLayout>
  );
}
