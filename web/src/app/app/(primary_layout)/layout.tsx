import React from 'react';
import { AppLayout } from '@/components/ui/layouts/AppLayout';
import { getAppSplitterLayout } from '@/components/ui/layouts/AppSplitter';
import { SidebarPrimary } from '@/components/features/sidebars/SidebarPrimary';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const defaultLayout = await getAppSplitterLayout('app-layout', ['230px', 'auto']);

  return (
    <AppLayout defaultLayout={defaultLayout} sidebar={<SidebarPrimary />}>
      {children}
    </AppLayout>
  );
}
