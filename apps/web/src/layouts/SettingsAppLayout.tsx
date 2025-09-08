import type React from 'react';
import { ComponentErrorCard } from '@/components/features/global/ComponentErrorCard';
import { SidebarSettings } from '@/components/features/sidebars/SidebarSettings';
import { AppLayout, type LayoutSize } from '@/components/ui/layouts/AppLayout';

interface IPrimaryAppLayoutProps {
  children: React.ReactNode;
  initialLayout: LayoutSize | null;
  layoutId: string;
  defaultLayout: LayoutSize;
}

export const SettingsAppLayout: React.FC<IPrimaryAppLayoutProps> = ({
  layoutId,
  children,
  initialLayout,
  defaultLayout,
}) => {
  return (
    <ComponentErrorCard header="Settings App Layout">
      <AppLayout
        autoSaveId={layoutId}
        defaultLayout={defaultLayout}
        initialLayout={initialLayout}
        sidebar={<SidebarSettings />}
      >
        {children}
      </AppLayout>
    </ComponentErrorCard>
  );
};
