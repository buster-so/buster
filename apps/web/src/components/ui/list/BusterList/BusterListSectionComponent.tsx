import React, { useMemo } from 'react';
import { Text } from '@/components/ui/typography';
import { useMemoizedFn } from '@/hooks';
import { cn } from '@/lib/classMerge';
import { CheckboxColumn } from './CheckboxColumn';
import { HEIGHT_OF_SECTION_ROW } from './config';
import { getAllIdsInSection } from './helpers';
import type { BusterListRowItem } from './interfaces';

export const BusterListSectionComponent = React.memo(
  React.forwardRef<
    HTMLDivElement,
    {
      rowSection: NonNullable<BusterListRowItem['rowSection']>;
      onSelectSectionChange?: (v: boolean, id: string) => void;
      id: string;
      selectedRowKeys?: string[];
      rows: BusterListRowItem[];
      style?: React.CSSProperties;
      rowClassName?: string;
    }
  >(
    (
      { rowSection, onSelectSectionChange, id, selectedRowKeys, rows, style, rowClassName },
      ref
    ) => {
      const indexOfSection = useMemo(() => {
        return rows.findIndex((row) => row.id === id);
      }, [rows.length, id]);

      const idsInSection = useMemo(() => {
        return getAllIdsInSection(rows, id);
      }, [rows.length, id]);

      const checkStatus = useMemo(() => {
        if (!selectedRowKeys) return 'unchecked';
        if (rowSection.disableSection) return 'unchecked';
        if (selectedRowKeys?.length === 0) return 'unchecked';

        const allIdsSelected = idsInSection.every((id) => selectedRowKeys.includes(id));
        if (allIdsSelected) return 'checked';
        const someIdsSelected = idsInSection.some((id) => selectedRowKeys.includes(id));
        if (someIdsSelected) return 'indeterminate';
        return 'unchecked';
      }, [selectedRowKeys?.length, idsInSection, indexOfSection, rowSection]);

      const onChange = useMemoizedFn((checked: boolean) => {
        onSelectSectionChange?.(checked, id);
      });

      return (
        <div
          className={cn(
            'bg-item-select group flex items-center',
            !!onSelectSectionChange && 'hover:bg-item-hover-active',
            !onSelectSectionChange && 'pl-3.5',
            rowClassName
          )}
          style={{
            height: `${HEIGHT_OF_SECTION_ROW}px`,
            minHeight: `${HEIGHT_OF_SECTION_ROW}px`,
            ...style
          }}
          ref={ref}>
          {onSelectSectionChange && (
            <CheckboxColumn checkStatus={checkStatus} onChange={onChange} />
          )}

          <div className={cn('flex items-center space-x-2 pl-[0px] leading-none')}>
            <Text size="sm">{rowSection.title}</Text>
            <Text size="sm" variant="tertiary">
              {rowSection.secondaryTitle}
            </Text>
          </div>
        </div>
      );
    }
  )
);
BusterListSectionComponent.displayName = 'BusterListSectionComponent';
