import React from 'react';
import { Card } from '@/components/ui/card/CardBase';
import { Text } from '@/components/ui/typography';

interface EmptyStateListProps {
  text: string;
  variant?: 'default' | 'card';
  show?: boolean;
}

export const EmptyStateList = React.memo(
  ({ show = true, text, variant = 'default' }: EmptyStateListProps) => {
    if (!show) return null;

    if (variant === 'card') {
      return (
        <div className="mx-[30px] flex w-full items-center justify-center">
          <Card className="w-full py-24 text-center">
            <Text variant="tertiary">{text}</Text>
          </Card>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Text variant="tertiary">{text}</Text>
      </div>
    );
  },
  () => true
);

EmptyStateList.displayName = 'EmptyStateList';
