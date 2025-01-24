import React from 'react';
import { Text } from '@/components/text';
import { Card } from 'antd';

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
            <Text type="tertiary">{text}</Text>
          </Card>
        </div>
      );
    }

    return (
      <div className="py-12">
        <Text type="tertiary">{text}</Text>
      </div>
    );
  }
);

EmptyStateList.displayName = 'EmptyStateList';
