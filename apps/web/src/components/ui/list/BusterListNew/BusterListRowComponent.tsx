import React from 'react';
import { cn } from '@/lib/classMerge';
import type { BusterListProps, BusterListRowItem } from './interfaces';

const BusterListRowComponentBase = <T = unknown>({
  link,
  data,
  dataTestId,
  rowClassName,
  hideLastRowBorder,
  onSelectSectionChange,
}: BusterListRowItem<T> &
  Pick<BusterListProps<T>, 'rowClassName' | 'hideLastRowBorder'> & {
    onSelectSectionChange?: (v: boolean, id: string) => void;
  }) => {
  return <div className={cn('h-full border-b', hideLastRowBorder && 'border-b-0!')}>row</div>;
};

export const BusterListRowComponent = React.memo(BusterListRowComponentBase);
