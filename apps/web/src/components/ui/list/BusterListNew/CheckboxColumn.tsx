import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/classMerge';
import { WIDTH_OF_CHECKBOX_COLUMN } from './config';

export type CheckboxStatus = 'checked' | 'unchecked' | 'indeterminate';

export const CheckboxColumn: React.FC<{
  checkStatus: CheckboxStatus | undefined;
  onChange: (v: boolean, e: React.MouseEvent) => void;
  className?: string;
  disabled?: boolean;
}> = React.memo(({ checkStatus, onChange, className = '', disabled = false }) => {
  const showBox = checkStatus === 'checked'; //|| checkStatus === 'indeterminate';

  const onClickStopPropagation = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    const value = checkStatus !== 'checked';
    onChange(value, e);
  };

  return (
    <div
      onClick={onClickStopPropagation}
      style={{
        width: `${WIDTH_OF_CHECKBOX_COLUMN}px`,
        minWidth: `${WIDTH_OF_CHECKBOX_COLUMN}px`,
      }}
      className={cn(
        className,
        'flex h-full items-center justify-center pr-1 pl-1 group-hover:opacity-100',
        showBox ? 'visible! opacity-100' : ''
      )}
    >
      <Checkbox
        checked={checkStatus === 'checked'}
        indeterminate={checkStatus === 'indeterminate'}
        disabled={disabled}
      />
    </div>
  );
});
CheckboxColumn.displayName = 'CheckboxColumn';
