import type React from 'react';
import { cn } from '@/lib/utils';
import { AppSplitter } from './AppSplitter/AppSplitter';
import type { LayoutSize } from './AppSplitter/AppSplitter.types';
import { createAutoSaveId } from './AppSplitter/create-auto-save-id';

/**
 * @param floating - Applies floating styles with padding and border (default: true)
 * @param className - Additional CSS classes
 * @param sidebar - Optional sidebar content on the left side
 * @param defaultLayout - Custom layout dimensions [leftWidth, rightWidth]
 * @param leftHidden - Whether the left sidebar is hidden
 * @param children - Main content of the layout
 */
export const AppLayout: React.FC<
  React.PropsWithChildren<{
    floating?: boolean;
    className?: string;
    sidebar?: React.ReactNode;
    defaultLayout: LayoutSize;
    initialLayout: LayoutSize | null;
    leftHidden?: boolean;
    autoSaveId: string;
  }>
> = ({
  children,
  defaultLayout,
  floating = true,
  className = '',
  sidebar,
  initialLayout,
  autoSaveId = 'app-layout',
}) => {
  const PageContent = (
    <PageLayout hasSidebar={!!sidebar} floating={floating} className={className}>
      {children}
    </PageLayout>
  );

  if (!sidebar) {
    return <>{PageContent}</>;
  }

  return (
    <AppSplitter
      defaultLayout={defaultLayout}
      className="max-h-screen min-h-screen overflow-hidden"
      autoSaveId={autoSaveId}
      preserveSide="left"
      splitterClassName={''}
      leftPanelMinSize={'175px'}
      leftPanelMaxSize={'300px'}
      hideSplitter={true}
      leftChildren={sidebar}
      rightChildren={PageContent}
      initialLayout={initialLayout}
      leftPanelElement="aside"
      rightPanelElement="main"
    />
  );
};

const PageLayout: React.FC<
  React.PropsWithChildren<{
    floating?: boolean;
    className?: string;
    hasSidebar?: boolean;
  }>
> = ({ children, floating = true, className = '', hasSidebar = false }) => {
  return (
    <div
      className={cn(
        'h-screen w-full overflow-hidden relative py-2',
        floating && hasSidebar ? 'pr-2' : 'pr-2 pl-2',
        className
      )}
    >
      <div
        className={cn('bg-page-background h-full overflow-hidden', floating && 'rounded border')}
      >
        {children}
      </div>
    </div>
  );
};

export type { LayoutSize };
export { createAutoSaveId };
