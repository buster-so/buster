import { cn } from '@/lib/classMerge';
import React, { useEffect, useState } from 'react';
import { Xmark } from '../../icons';
import { TriangleWarning } from '../../icons/NucleoIconFilled';
import { Popover } from '../../popover';
import { Text } from '../../typography/Text';
import { DOWNSIZE_SAMPLE_THRESHOLD } from '../config';

export const DownsampleAlert = React.memo(({ isDownsampled }: { isDownsampled: boolean }) => {
  const [close, setClose] = useState(false);
  const [onHover, setOnHover] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setClose(false);
  }, [isDownsampled]);

  if (close) {
    return null;
  }

  return (
    <div className="absolute right-0 bottom-0.5 left-0 w-full px-1 pb-0">
      <Popover
        align="center"
        side="top"
        open={open}
        sideOffset={8}
        onOpenChange={setOpen}
        content={
          <div className="max-w-68">
            <Text>{`This chart has been downsampled to ${DOWNSIZE_SAMPLE_THRESHOLD} data points to improve performance. Click the results tab or download the data to see all points.`}</Text>
          </div>
        }>
        <button
          type="button"
          onClick={() => open && setClose(true)}
          onMouseEnter={() => setOnHover(true)}
          onMouseLeave={() => setOnHover(false)}
          className={cn(
            'group relative z-10 flex h-6 w-full cursor-pointer items-center justify-center overflow-hidden rounded-sm border px-1.5 text-sm',
            'border-gray-100 bg-white text-gray-500 shadow transition-all duration-200 hover:bg-gray-50',
            'dark:border-yellow-500/30 dark:bg-yellow-900/10 dark:text-yellow-300 dark:hover:bg-yellow-900/20'
          )}>
          <div
            className={cn(
              'absolute flex items-center space-x-1 transition-all duration-300',
              open ? 'scale-50 opacity-0' : 'scale-100 opacity-100'
            )}>
            <TriangleWarning />
            <span>Downsampled</span>
          </div>
          <div
            className={cn(
              'absolute flex items-center space-x-1 transition-all duration-300',
              !open ? 'scale-50 opacity-0' : 'scale-100 opacity-100'
            )}>
            <Xmark />
            <span>Close</span>
          </div>
        </button>
      </Popover>
    </div>
  );
});

DownsampleAlert.displayName = 'DownsampleAlert';
