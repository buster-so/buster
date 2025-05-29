import type React from 'react';
import { cn } from '@/lib/utils';
import { AppPageLayoutContent } from './AppPageLayoutContent';
import { AppPageLayoutHeader } from './AppPageLayoutHeader';

/**
 * @param header - Header content at the top of the page
 * @param floating - Applies floating styles (default: true)
 * @param scrollable - Makes content scrollable (default: true)
 * @param className - Additional CSS classes
 * @param children - Page content
 * @internal
 */
export const AppPageLayout: React.FC<
  React.PropsWithChildren<{
    header?: React.ReactNode;
    scrollable?: boolean;
    className?: string;
    headerSizeVariant?: 'default' | 'list';
    headerBorderVariant?: 'default' | 'ghost';
    headerClassName?: string;
    mainClassName?: string;
    contentContainerId?: string;
  }>
> = ({
  children,
  header,
  scrollable = false,
  className = '',
  headerSizeVariant = 'default',
  headerBorderVariant = 'default',
  headerClassName = '',
  mainClassName = '',
  contentContainerId
}) => {
  return (
    <div
      className={cn(
        'app-page-layout flex h-full w-full flex-col overflow-hidden',
        scrollable && 'overflow-y-auto',
        className
      )}>
      {header && (
        <AppPageLayoutHeader
          className={cn(headerBorderVariant === 'ghost' && '-mt-[0.5px]', headerClassName)}
          sizeVariant={headerSizeVariant}
          borderVariant={headerBorderVariant}>
          {header}
        </AppPageLayoutHeader>
      )}

      <AppPageLayoutContent
        className={cn(headerBorderVariant === 'ghost' && 'scroll-shadow-container', mainClassName)}
        scrollable={scrollable}
        id={contentContainerId}>
        {header && scrollable && headerBorderVariant === 'ghost' && (
          <div className="scroll-header" />
        )}

        {children}
      </AppPageLayoutContent>
    </div>
  );
};
