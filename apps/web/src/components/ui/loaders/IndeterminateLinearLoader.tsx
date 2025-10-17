import React from 'react';
import { twMerge } from 'tailwind-merge';

export const IndeterminateLinearLoader: React.FC<{
  className?: string;
  style?: React.CSSProperties;
  height?: number;
  trackColor?: string;
  valueColor?: string;
}> = React.memo(({ className = '', trackColor, valueColor, style, height = 2 }) => {
  return (
    <div
      className={`h-1.5 w-full overflow-hidden bg-gray-200 ${className}`}
      style={{ ...style, height, backgroundColor: trackColor }}
    >
      <div
        className={twMerge(
          'bg-primary',
          'animate-indeterminate-progress-bar h-full w-full origin-left'
        )}
        style={{ backgroundColor: valueColor }}
      />
    </div>
  );
});

IndeterminateLinearLoader.displayName = 'IndeterminateLinearLoader';
