import type React from 'react';
import {
  SidebarPrimary,
  type SidebarPrimaryProps,
} from '@/components/features/sidebars/SidebarPrimary';
import { AppLayout, type LayoutSize } from '@/components/ui/layouts/AppLayout';

type IPrimaryAppLayoutProps = {
  children: React.ReactNode;
  initialLayout: LayoutSize | null;
  layoutId: string;
  defaultLayout: LayoutSize;
} & SidebarPrimaryProps;

export const PrimaryAppLayout: React.FC<IPrimaryAppLayoutProps> = ({
  layoutId,
  children,
  initialLayout,
  defaultLayout,
  ...rest
}) => {
  return (
    <AppLayout
      autoSaveId={layoutId}
      defaultLayout={defaultLayout}
      initialLayout={initialLayout}
      sidebar={<SidebarPrimary {...rest} />}
    >
      {children}
    </AppLayout>
  );
};
