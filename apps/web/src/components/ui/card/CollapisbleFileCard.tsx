'use client';

import { useMemoizedFn } from '@/hooks';
import { cn } from '@/lib/classMerge';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Text } from '../typography/Text';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from '../icons';

interface CollapisbleFileCardProps {
  fileName?: string | React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  children?: React.ReactNode;
  collapsible?: 'chevron' | 'overlay-peek' | false;
  collapseContent?: boolean;
  collapseDefaultIcon?: React.ReactNode;
  onCollapse?: (value: boolean) => void;
  headerWrapper?: React.ComponentType<{ children: React.ReactNode }>;
  selected?: boolean;
}

const MIN_COLLAPSIBLE_HEIGHT = 150;

export const CollapisbleFileCard = React.memo(
  ({
    fileName,
    className,
    children,
    collapsible,
    icon,
    collapseContent = true,
    headerClassName,
    collapseDefaultIcon,
    bodyClassName,
    headerWrapper,
    selected,
    onCollapse
  }: CollapisbleFileCardProps) => {
    const [isCollapsed, setIsCollapsed] = useState(collapseContent);
    const [isHeaderHovered, setIsHeaderHovered] = useState(false);
    const lastClickTime = useRef<number>(0);

    const isChevronCollapsible = collapsible === 'chevron' && !!children;
    const showHeader = !!fileName || collapsible;

    const handleCollapseClick = useMemoizedFn((e: React.MouseEvent<HTMLDivElement>) => {
      if (!collapsible) return;

      e.preventDefault();
      e.stopPropagation();

      const now = Date.now();
      if (now - lastClickTime.current < 50) {
        return;
      }
      lastClickTime.current = now;

      const newCollapsedState = !isCollapsed;
      setIsCollapsed(newCollapsedState);
      onCollapse?.(newCollapsedState);
    });

    const handleHeaderMouseEnter = useMemoizedFn(() => {
      if (collapsible) {
        setIsHeaderHovered(true);
      }
    });

    const handleHeaderMouseLeave = useMemoizedFn(() => {
      if (collapsible) {
        setIsHeaderHovered(false);
      }
    });

    const HeaderWrapperComponent = headerWrapper || React.Fragment;

    const Content = children && (
      <div className={cn('bg-background relative h-full overflow-hidden p-0', bodyClassName)}>
        {children}
      </div>
    );

    return (
      <div
        className={cn(
          'bg-background text-foreground border-border overflow-hidden rounded border shadow transition',
          !selected ? 'hover:border-gray-light' : 'border-foreground shadow-md',
          className
        )}>
        {showHeader && (
          <HeaderWrapperComponent>
            <div
              className={cn(
                //Blake was insisting on 11px padding... not the standard 12px
                'item-center flex h-8 w-full border-b px-[11px] py-1 transition-all duration-200',
                isChevronCollapsible && 'cursor-pointer select-none',
                ((isChevronCollapsible && isCollapsed) || !children) && 'border-b-transparent',
                headerClassName
              )}
              onMouseEnter={handleHeaderMouseEnter}
              onMouseLeave={handleHeaderMouseLeave}>
              <div className="flex w-full items-center gap-x-1.5 overflow-hidden whitespace-nowrap">
                {isChevronCollapsible && (
                  <CollapseToggleIcon
                    isCollapsed={isCollapsed}
                    isHovered={isHeaderHovered}
                    collapseDefaultIcon={collapseDefaultIcon}
                    onClick={handleCollapseClick}
                  />
                )}
                {icon}
                {typeof fileName === 'string' ? <Text truncate>{fileName}</Text> : fileName}
              </div>
            </div>
          </HeaderWrapperComponent>
        )}

        {collapsible && Content ? (
          <CollapseContent
            collapsible={collapsible}
            isCollapsed={isCollapsed}
            onCollapseClick={handleCollapseClick}>
            {Content}
          </CollapseContent>
        ) : (
          Content
        )}
      </div>
    );
  }
);

CollapisbleFileCard.displayName = 'CollapisbleFileCard';

const CollapseContent = React.memo(
  ({
    children,
    isCollapsed,
    collapsible,
    onCollapseClick
  }: {
    children: React.ReactNode;
    isCollapsed: boolean;
    collapsible: NonNullable<CollapisbleFileCardProps['collapsible']>;
    onCollapseClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  }) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [fullHeight, setFullHeight] = useState<number | null>(null);
    const [isInitialMount, setIsInitialMount] = useState(true);

    const collapsedHeight = useMemo(() => {
      if (!fullHeight) return 32; // fallback
      const sixtyFivePercent = Math.floor(fullHeight * 0.65);
      return Math.min(sixtyFivePercent, 200);
    }, [fullHeight]);

    // Check if content is too small to warrant collapsing (for overlay-peek only)
    const isTooSmallToCollapse = useMemo(() => {
      return (
        collapsible === 'overlay-peek' && fullHeight !== null && fullHeight < MIN_COLLAPSIBLE_HEIGHT
      );
    }, [collapsible, fullHeight]);

    // Measure content height when it changes
    useEffect(() => {
      if (collapsible === 'overlay-peek' && contentRef.current) {
        const resizeObserver = new ResizeObserver(() => {
          if (contentRef.current) {
            setFullHeight(contentRef.current.scrollHeight);
          }
        });

        resizeObserver.observe(contentRef.current);
        // Initial measurement
        setFullHeight(contentRef.current.scrollHeight);

        if (isInitialMount) {
          setTimeout(() => {
            setIsInitialMount(false);
          }, 220);
        }

        return () => resizeObserver.disconnect();
      }
    }, [collapsible, children]);

    const ExpandButton = useMemo(() => {
      return collapsible === 'overlay-peek' && !isTooSmallToCollapse ? (
        <div
          onClick={onCollapseClick}
          className="bg-background hover:bg-item-hover absolute inset-x-0 bottom-0 m-1 flex h-7 scale-95 cursor-pointer items-center justify-center gap-x-1 rounded border bg-gradient-to-b opacity-0 shadow transition-all delay-75 duration-200 group-hover:scale-100 group-hover:opacity-100">
          <div className={cn('transition-transform duration-200', !isCollapsed && 'rotate-180')}>
            <ChevronDown />
          </div>
          <Text>{isCollapsed ? 'Click to expand' : 'Click to collapse'}</Text>
        </div>
      ) : null;
    }, [collapsible, isCollapsed, onCollapseClick, isTooSmallToCollapse]);

    const ContentWrapper = useMemo(
      () => (
        <div ref={contentRef} className="w-full">
          {children}
        </div>
      ),
      [children]
    );

    // Handle overlay-peek differently
    if (collapsible === 'overlay-peek') {
      // If content is too small, just render it without collapse functionality
      if (isTooSmallToCollapse) {
        return <div className="relative overflow-hidden">{ContentWrapper}</div>;
      }

      // Normal overlay-peek behavior for larger content
      return (
        <AnimatePresence initial={false}>
          <motion.div
            className="group relative overflow-hidden"
            initial={{
              height: isCollapsed ? collapsedHeight : 'auto',
              filter: 'blur(0px)'
            }}
            animate={{
              height: isCollapsed ? collapsedHeight : 'auto',
              filter: 'blur(0px)'
            }}
            transition={{
              duration: isInitialMount ? 0 : 0.25,
              ease: 'easeInOut',
              filter: {
                duration: 0.15
              }
            }}
            data-testid="collapse-content">
            {ContentWrapper}
            {ExpandButton}
          </motion.div>
        </AnimatePresence>
      );
    }

    // Handle chevron collapse
    return (
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              duration: 0.2,
              ease: 'easeInOut'
            }}
            className="group relative overflow-hidden"
            data-testid="collapse-content">
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

CollapseContent.displayName = 'CollapseContent';

const CollapseToggleIcon = React.memo(
  ({
    isCollapsed,
    isHovered,
    collapseDefaultIcon,
    className,
    onClick
  }: {
    isCollapsed: boolean;
    isHovered: boolean;
    collapseDefaultIcon: React.ReactNode;
    className?: string;
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  }) => {
    const showChevron = (isHovered || !isCollapsed) && collapseDefaultIcon;
    const showDefaultIcon = !isHovered && isCollapsed && collapseDefaultIcon;

    return (
      <div
        className={cn(
          'hover:bg-item-active relative flex h-5 w-5 items-center justify-center rounded-sm text-lg transition-colors duration-100',
          className
        )}
        onClick={onClick}>
        <AnimatePresence mode="sync" initial={false}>
          {showChevron && (
            <motion.div
              key="chevron"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: !isCollapsed ? 0 : -90 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.165, ease: 'easeInOut' }}
              className={cn(
                'text-icon-color absolute inset-0 flex h-5 w-5 items-center justify-center text-base'
              )}>
              <ChevronDown />
            </motion.div>
          )}
          {showDefaultIcon && (
            <motion.div
              key="default"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12, ease: 'easeInOut' }}
              className="text-icon-color absolute inset-0 flex h-5 w-5 items-center justify-center">
              {collapseDefaultIcon}
            </motion.div>
          )}
          {!showChevron && !showDefaultIcon && (
            <motion.div
              key="fallback-chevron"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12, ease: 'easeInOut' }}
              className={cn(
                collapseDefaultIcon && 'absolute',
                'text-icon-color inset-0 flex h-4 w-4 items-center justify-center transition-transform duration-200',
                !isCollapsed && 'rotate-180'
              )}>
              <ChevronDown />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

CollapseToggleIcon.displayName = 'CollapseToggleIcon';
