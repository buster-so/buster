import React from 'react';
import { cn } from '@/lib/classMerge';
import type { BusterListProps, BusterListRowItem } from './interfaces';

const BusterListRowComponentBase = <T = unknown>({
  link,
  data,
  dataTestId,
  rowClassName,
  onSelectSectionChange,
}: BusterListRowItem<T> &
  Pick<BusterListProps<T>, 'rowClassName'> & {
    onSelectSectionChange?: (v: boolean, id: string) => void;
  }) => {
  return <div className={cn('h-12 border-b')}>row</div>;
};

export const BusterListRowComponent = React.memo(BusterListRowComponentBase);
