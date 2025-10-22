import React, { useMemo } from 'react';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/classMerge';
import { CheckboxColumn, type CheckboxStatus } from './CheckboxColumn';
import type { BusterListProps, BusterListSectionRow } from './interfaces';

export type BusterListRowSectionProps<T = unknown> = BusterListSectionRow &
  Pick<BusterListProps<T>, 'rowClassName' | 'selectedRowKeys'> & {
    onSelectSectionChange?: (v: boolean, id: string) => void;
    idsPerSection: Map<string, Set<string>>;
  };

const BusterListRowSectionBase = <T = unknown>({
  title,
  secondaryTitle,
  id,
  disableSection,
  onSelectSectionChange,
  rowClassName,
  selectedRowKeys,
}: BusterListRowSectionProps<T>) => {
  const checkStatus: CheckboxStatus = useMemo(() => {
    return 'unchecked';
  }, []);

  const onChange = (v: boolean, e: React.MouseEvent) => {
    onSelectSectionChange?.(v, id);
  };

  return (
    <div
      className={cn(
        'h-8',
        'bg-item-select group flex items-center',
        onSelectSectionChange ? 'hover:bg-item-hover-active' : 'pl-3.5',
        rowClassName
      )}
      data-testid={`buster-list-row-section-${id}`}
    >
      {onSelectSectionChange && <CheckboxColumn checkStatus={checkStatus} onChange={onChange} />}

      <div className={cn('flex items-center space-x-2 pl-[0px] leading-none')}>
        <Text size="sm">{title}</Text>
        <Text size="sm" variant="tertiary">
          {secondaryTitle}
        </Text>
      </div>
    </div>
  );
};

export const BusterListRowSection = React.memo(BusterListRowSectionBase) as <T = unknown>(
  props: BusterListRowSectionProps<T>
) => React.ReactElement;
