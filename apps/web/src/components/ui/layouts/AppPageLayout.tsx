import type React from 'react';
import { cn } from '@/lib/utils';
import { AppPageLayoutContent } from './AppPageLayoutContent';
import { AppPageLayoutHeader } from './AppPageLayoutHeader';

export type AppPageLayoutProps = {
  header?: React.ReactNode;
  secondaryHeader?: React.ReactNode;
  scrollable?: boolean;
  className?: string;
  headerSizeVariant?: 'default' | 'list';
  headerBorderVariant?: 'default' | 'ghost';
  headerClassName?: string;
  mainClassName?: string;
  contentContainerId?: string;
  id?: string;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  scrollContainerStyle?: React.CSSProperties;
};

/**
 * @param header - Header content at the top of the page
 * @param floating - Applies floating styles (default: true)
 * @param scrollable - Makes content scrollable (default: true)
 * @param className - Additional CSS classes
 * @param children - Page content
 * @internal
 */
export const AppPageLayout: React.FC<React.PropsWithChildren<AppPageLayoutProps>> = ({
  children,
  header,
  id,
  secondaryHeader,
  scrollable = false,
  className = '',
  headerSizeVariant = 'default',
  headerBorderVariant = 'default',
  headerClassName = '',
  mainClassName = '',
  contentContainerId,
  scrollContainerRef,
  scrollContainerStyle,
}) => {
  const isGhostBorder = headerBorderVariant === 'ghost';

  return (
    <div
      id={id}
      className={cn(
        'app-page-layout flex h-full w-full flex-col overflow-hidden',
        scrollable && 'overflow-y-auto',
        className
      )}
    >
      {header && (
        <AppPageLayoutHeader className={headerClassName} sizeVariant={headerSizeVariant}>
          {header}
        </AppPageLayoutHeader>
      )}

      {secondaryHeader && (
        <AppPageLayoutHeader className={headerClassName} sizeVariant={headerSizeVariant}>
          {secondaryHeader}
        </AppPageLayoutHeader>
      )}

      <AppPageLayoutContent
        className={cn(isGhostBorder && 'scroll-shadow-container', mainClassName)}
        scrollable={scrollable}
        id={contentContainerId}
        viewportRef={scrollContainerRef}
        scrollContainerStyle={scrollContainerStyle}
      >
        <div
          data-testid="scroll-shadow-bar"
          className={cn(
            'pointer-events-none top-[0px]  z-10 right-0 left-0 h-[0.5px] w-full sticky bg-border transition-colors duration-300',
            isGhostBorder && 'scroll-header',
            !scrollable && isGhostBorder && 'bg-transparent'
          )}
        />

        {children}
      </AppPageLayoutContent>
    </div>
  );
};
