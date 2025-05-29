import React, { useMemo } from 'react';
import { DEFAULT_COLUMN_LABEL_FORMAT } from '@/api/asset_interfaces';
import type { IColumnLabelFormat } from '@/api/asset_interfaces/metric/charts';
import { Text } from '@/components/ui/typography';
import { formatLabel } from '@/lib';
import { cn } from '@/lib/classMerge';
import { ColumnTypeIcon } from './config';

export const SelectAxisItemLabel = React.memo(
  ({
    id,
    columnLabelFormat,
    onClick
  }: {
    id: string;
    columnLabelFormat: IColumnLabelFormat | undefined;
    onClick?: () => void;
  }) => {
    const { style } = columnLabelFormat || DEFAULT_COLUMN_LABEL_FORMAT;

    const label = useMemo(() => {
      return formatLabel(id, columnLabelFormat, true);
    }, [columnLabelFormat, id]);

    const Icon = useMemo(() => ColumnTypeIcon[style] || ColumnTypeIcon.string, [style]);

    return (
      <button
        type="button"
        className={`flex items-center space-x-1.5 overflow-hidden whitespace-nowrap ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
        onKeyUp={(e) => e.key === 'Enter' && onClick?.()}
        onKeyDown={(e) => e.key === 'Enter' && onClick?.()}>
        <div className={cn('text-icon-color flex')}>{Icon.icon}</div>
        <Text className="truncate">{label}</Text>
      </button>
    );
  }
);
SelectAxisItemLabel.displayName = 'SelectAxisItemLabel';
