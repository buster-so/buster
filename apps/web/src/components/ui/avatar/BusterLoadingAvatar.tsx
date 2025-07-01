import React from 'react';
import { BusterLoadingLogo } from '../loaders/BusterLoadingLogo';
import { cn } from '@/lib/classMerge';

interface BusterLoadingAvatarProps {
  className?: string;
  loading: boolean;
  variant?: 'default' | 'gray';
  size?: number;
}

export const BusterLoadingAvatar = React.memo(function BusterLoadingAvatar({
  className,
  loading,
  variant = 'default',
  size = 24
}: BusterLoadingAvatarProps) {
  return (
    <div
      className={cn('flex items-center justify-center rounded-full border', className)}
      style={{ width: size, height: size }}>
      <BusterLoadingLogo
        isLoading={loading}
        style={{ width: `${size - 10}px`, height: `${size - 10}px` }}
        foregroundColor={variant === 'gray' ? 'var(--color-gray-light)' : 'var(--color-foreground)'}
      />
    </div>
  );
});

BusterLoadingAvatar.displayName = 'BusterLoadingAvatar';
