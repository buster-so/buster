import { cn } from '@/lib/classMerge';
import type { ISashContentProps } from './types';

function SashContent({ className, children, active, type, ...others }: ISashContentProps) {
  return (
    <div
      className={cn(
        'split-sash-content',
        active && 'split-sash-content-active',
        type && `split-sash-content-${type}`,
        className
      )}
      {...others}>
      {children}
    </div>
  );
}

export default SashContent;
