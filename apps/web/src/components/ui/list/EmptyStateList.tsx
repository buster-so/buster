import React from 'react';
import { Card } from '@/components/ui/card/CardBase';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

interface EmptyStateListProps {
  text: string;
  variant?: 'default' | 'card';
  show?: boolean;
  className?: string;
}

export const EmptyStateList = React.memo(
  ({ show = true, text, variant = 'default', className }: EmptyStateListProps) => {
    if (!show) return null;

    if (variant === 'card') {
      return (
        <div className={cn('mx-[30px] flex w-full items-center justify-center', className)}>
          <Card className="w-full py-24 text-center">
            <Text variant="tertiary">{text}</Text>
          </Card>
        </div>
      );
    }

    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
        <Text variant="tertiary">{text}</Text>
      </div>
    );
  },
  () => true
);

EmptyStateList.displayName = 'EmptyStateList';
