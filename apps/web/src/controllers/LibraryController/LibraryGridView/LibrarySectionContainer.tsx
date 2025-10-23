import type React from 'react';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

export const LibrarySectionContainer = ({
  children,
  title,
  icon,
  className,
  ref,
  style,
}: {
  children: React.ReactNode;
  title: string;
  description?: string;
  icon: React.ReactNode;
  className?: string;
  ref?: React.RefObject<HTMLDivElement>;
  style?: React.CSSProperties;
}) => {
  return (
    <LibrarySectionWrapper ref={ref} style={style} className={className}>
      <LibrarySectionHeader title={title} icon={icon} />
      {children}
    </LibrarySectionWrapper>
  );
};

export const LibrarySectionWrapper = ({
  ref,
  children,
  className,
  style,
}: {
  ref?: React.RefObject<HTMLDivElement>;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) => {
  return (
    <div ref={ref} style={style} className={cn('flex flex-col gap-y-3', className)}>
      {children}
    </div>
  );
};

export const LibrarySectionHeader = ({ title, icon }: { title: string; icon: React.ReactNode }) => {
  return (
    <div className="flex items-center space-x-1 mx-2">
      <span className="text-text-secondary">{icon}</span>
      <Text variant={'secondary'} size={'sm'}>
        {title}
      </Text>
    </div>
  );
};
