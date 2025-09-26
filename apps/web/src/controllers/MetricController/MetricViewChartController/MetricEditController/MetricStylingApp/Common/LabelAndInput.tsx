import type React from 'react';
import { CircleInfo } from '@/components/ui/icons';
import { AppTooltip } from '@/components/ui/tooltip';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/classMerge';

export const LabelAndInput: React.FC<{
  label: string | React.ReactNode;
  labelInfoTooltip?: string | React.ReactNode;
  children: React.ReactNode;
  dataTestId?: string;
}> = ({ label, labelInfoTooltip, children, dataTestId }) => {
  return (
    <div
      data-testid={dataTestId}
      className={cn('grid w-full grid-cols-[minmax(35px,115px)_1fr] items-center gap-2 h-7')}
    >
      <div className="flex items-center gap-x-1">
        <Text size="sm" variant="secondary">
          {label}
        </Text>
        {labelInfoTooltip && (
          <AppTooltip title={labelInfoTooltip}>
            <span className="text-text-secondary cursor-pointer text-xs">
              <CircleInfo />
            </span>
          </AppTooltip>
        )}
      </div>

      {children}
    </div>
  );
};
