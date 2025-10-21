import type React from 'react';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

export const LibrarySectionContainer = ({
  children,
  title,
  icon,
  className,
}: {
  children: React.ReactNode;
  title: string;
  description?: string;
  icon: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn('flex flex-col gap-y-3', className)}>
      <div className="flex items-center space-x-1 mx-2">
        <span className="text-text-secondary">{icon}</span>
        <Text variant={'secondary'} size={'sm'}>
          {title}
        </Text>
      </div>

      {children}
    </div>
  );
};
