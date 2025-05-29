import { Xmark } from '@/components/ui/icons';
import { cn } from '@/lib/classMerge';
import type * as React from 'react';

export const InputTag: React.FC<{
  label: string | React.ReactNode;
  value: string;
  onRemove: (valueToRemove: string) => void;
  className?: string;
  disabled?: boolean;
}> = ({ label, value, onRemove, className, disabled }) => {
  return (
    <div
      data-tag="true"
      className={cn(
        'bg-item-hover text-foreground inline-flex h-full flex-shrink-0 items-center gap-1 rounded-sm border pr-0.5 pl-1.5 text-xs',
        disabled && 'cursor-not-allowed opacity-80',
        className
      )}>
      <span className="max-w-[100px] truncate">{label}</span>
      <button
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) {
            onRemove(value);
          }
        }}
        className={cn(
          'text-icon-color pointer-events-auto flex h-3.5 w-3.5 cursor-pointer items-center justify-center rounded-sm focus:outline-none',
          !disabled && 'hover:bg-item-hover-active hover:text-foreground'
        )}>
        <div className="text-xs">
          <Xmark />
        </div>
      </button>
    </div>
  );
};
InputTag.displayName = 'InputTag';
