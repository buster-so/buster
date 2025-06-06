import React from 'react';
import { TriangleWarning } from '@/components/ui/icons';
import { Popover } from '@/components/ui/popover/Popover';
import { cn } from '@/lib/classMerge';

export const WarningIcon: React.FC<{
  rowCountThreshold?: number;
  rowCount: number;

  warningText?: string;
}> = React.memo(
  ({
    rowCount,
    rowCountThreshold = 25,
    warningText = 'Data labels will be hidden if there are too many.'
  }) => {
    if (rowCount <= rowCountThreshold) {
      return null;
    }
    return (
      <Popover
        side="left"
        align="center"
        size="none"
        content={<div className="max-w-[170px] p-2">{warningText}</div>}>
        <div
          className={cn(
            'text-text-tertiary hover:text-text-secondary flex h-full cursor-pointer items-center'
          )}>
          <TriangleWarning />
        </div>
      </Popover>
    );
  }
);
WarningIcon.displayName = 'WarningIcon';
