import React, { useState } from 'react';
import { cn } from '@/lib/classMerge';
import { Text } from '../typography/Text';
import { Card, CardContent, CardFooter, CardHeader } from './CardBase';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from '@/components/ui/icons';

interface FileCardProps {
  fileName?: string | React.ReactNode;
  headerButtons?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  bodyClassName?: string;
  footer?: React.ReactNode;
  footerClassName?: string;
  collapsible?: boolean;
  collapseContent?: boolean;
  collapseDefaultIcon?: React.ReactNode;
  onCollapse?: (value: boolean) => void;
  headerClassName?: string;
}

export const FileCard = React.memo(
  ({
    fileName,
    className,
    headerButtons,
    children,
    bodyClassName,
    footer,
    footerClassName,
    headerClassName,
    collapsible = false,
    collapseContent = false,
    collapseDefaultIcon,
    onCollapse
  }: FileCardProps) => {
    const [isCollapsed, setIsCollapsed] = useState(collapseContent);
    const [isHeaderHovered, setIsHeaderHovered] = useState(false);

    const showHeader = !!fileName || !!headerButtons || collapsible;

    const handleHeaderClick = () => {
      if (!collapsible) return;

      const newCollapsedState = !isCollapsed;
      setIsCollapsed(newCollapsedState);
      onCollapse?.(newCollapsedState);
    };

    const handleHeaderMouseEnter = () => {
      if (collapsible) {
        setIsHeaderHovered(true);
      }
    };

    const handleHeaderMouseLeave = () => {
      if (collapsible) {
        setIsHeaderHovered(false);
      }
    };

    return (
      <Card className={cn('h-full', className)}>
        {showHeader && (
          <CardHeader
            variant={'gray'}
            size={'xsmall'}
            className={cn(
              'justify-center',
              collapsible && 'cursor-pointer select-none',
              collapsible && isCollapsed && 'border-b-0',
              headerClassName
            )}
            onClick={handleHeaderClick}
            onMouseEnter={handleHeaderMouseEnter}
            onMouseLeave={handleHeaderMouseLeave}>
            <div className="flex items-center gap-x-1">
              <div className="flex items-center gap-1 whitespace-nowrap">
                {collapseDefaultIcon && (
                  <CollapseToggleIcon
                    isCollapsed={isCollapsed}
                    isHovered={isHeaderHovered}
                    collapseDefaultIcon={collapseDefaultIcon}
                  />
                )}
                {headerButtons}
              </div>
              {typeof fileName === 'string' ? <Text truncate>{fileName}</Text> : fileName}
            </div>
          </CardHeader>
        )}

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
              style={{ overflow: 'hidden' }}>
              <CardContent
                className={cn('bg-background relative h-full overflow-hidden p-0', bodyClassName)}>
                {children}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>

        {footer && (
          <CardFooter className={cn('bg-background px-4 py-2.5', footerClassName)}>
            {footer}
          </CardFooter>
        )}
      </Card>
    );
  }
);

FileCard.displayName = 'FileCard';

const CollapseToggleIcon = React.memo(
  ({
    isCollapsed,
    isHovered,
    collapseDefaultIcon,
    className
  }: {
    isCollapsed: boolean;
    isHovered: boolean;
    collapseDefaultIcon: React.ReactNode;
    className?: string;
  }) => {
    const showChevron = isHovered || !isCollapsed;
    const showDefaultIcon = !isHovered && isCollapsed && collapseDefaultIcon;

    return (
      <div className={cn('relative h-4 w-4', className)}>
        <AnimatePresence mode="sync">
          {showChevron && (
            <motion.div
              key="chevron"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12, ease: 'easeInOut' }}
              className={cn(
                'text-icon-color absolute inset-0 flex h-4 w-4 items-center justify-center transition-transform duration-200',
                !isCollapsed && 'rotate-180'
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
              className="text-icon-color absolute inset-0 flex h-4 w-4 items-center justify-center">
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
                'text-icon-color absolute inset-0 flex h-4 w-4 items-center justify-center transition-transform duration-200',
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
