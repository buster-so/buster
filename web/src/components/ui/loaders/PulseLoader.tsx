import type React from 'react';
import { cn } from '@/lib/classMerge';

export const PulseLoader: React.FC<{
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  className?: string;
}> = ({ style, color, size = 8, className }) => {
  return (
    <span className={cn('flex flex-col items-center justify-center space-y-4', className)}>
      <span
        className="relative flex"
        style={{
          ...style,
          width: `${size}px`,
          height: `${size}px`
        }}>
        <span
          className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
          style={{
            backgroundColor: color
          }}
        />
        <span
          className="bg-primary relative inline-flex h-full w-full rounded-full"
          style={{
            backgroundColor: color
          }}
        />
      </span>
    </span>
  );
};

export const TextDotLoader: React.FC<{
  showPulseLoader?: boolean;
  size?: number;
  className?: string;
}> = ({ size = 8, showPulseLoader = true, className }) => {
  return (
    <>
      {showPulseLoader && (
        <span
          className={cn(className)}
          style={{
            opacity: 0.6,
            display: 'inline-block',
            width: size,
            height: size,
            backgroundColor: 'var(--color-text-default)',
            borderRadius: '100%'
          }}
        />
      )}
    </>
  );
};

export default PulseLoader;
