import React, { useCallback } from 'react';
import type { BusterTableChartConfig } from './interfaces';
import { formatLabel } from '@/lib/columnFormatter';
import {
  type IBusterMetricChartConfig,
  type BusterChartPropsBase,
  DEFAULT_CHART_CONFIG
} from '@/api/asset_interfaces/metric';
import { useMemoizedFn } from '@/hooks';
import { AppDataGrid } from '@/components/ui/table/AppDataGrid';
import { cn } from '@/lib/classMerge';
import isEmpty from 'lodash/isEmpty';
import { useUpdateMetricChart } from '@/context/Metrics';

export interface BusterTableChartProps extends BusterTableChartConfig, BusterChartPropsBase {}

const BusterTableChartBase: React.FC<BusterTableChartProps> = ({
  className = '',
  onMounted,
  data,
  tableColumnOrder,
  columnLabelFormats = DEFAULT_CHART_CONFIG.columnLabelFormats,
  tableColumnWidths = DEFAULT_CHART_CONFIG.tableColumnWidths,
  readOnly = false,
  onInitialAnimationEnd,
  //TODO
  tableHeaderBackgroundColor,
  tableHeaderFontColor,
  tableColumnFontColor
}) => {
  const { onUpdateMetricChartConfig, onInitializeTableColumnWidths } = useUpdateMetricChart();

  const onChangeConfig = useMemoizedFn((config: Partial<IBusterMetricChartConfig>) => {
    if (readOnly) return;
    onUpdateMetricChartConfig({ chartConfig: config });

    if (
      (tableColumnWidths === null || isEmpty(tableColumnWidths)) &&
      !isEmpty(config.tableColumnWidths)
    ) {
      onInitializeTableColumnWidths(config.tableColumnWidths);
    }
  });

  const onUpdateTableColumnOrder = useMemoizedFn((columns: string[]) => {
    if (readOnly) return;
    const config: Partial<IBusterMetricChartConfig> = {
      tableColumnOrder: columns
    };

    onChangeConfig(config);
  });

  const onUpdateTableColumnSize = useMemoizedFn((columns: { key: string; size: number }[]) => {
    if (readOnly) return;
    const config: Partial<IBusterMetricChartConfig> = {
      tableColumnWidths: columns.reduce<Record<string, number>>((acc, { key, size }) => {
        acc[key] = Number(size.toFixed(1));
        return acc;
      }, {})
    };
    onChangeConfig(config);
  });

  //THIS MUST BE A USE CALLBACK
  const onFormatHeader = useCallback(
    (value: string | number | null | Date | boolean, columnName: string) => {
      return formatLabel(value, columnLabelFormats[columnName], true);
    },
    [columnLabelFormats]
  );
  //THIS MUST BE A USE CALLBACK
  const onFormatCell = useCallback(
    (value: string | number | null | Date | boolean, columnName: string) => {
      return formatLabel(value, columnLabelFormats[columnName], false);
    },
    [columnLabelFormats]
  );

  const onReady = useMemoizedFn(() => {
    onMounted?.();
    requestAnimationFrame(() => {
      onInitialAnimationEnd?.();
    });
  });

  return (
    <AppDataGrid
      className={cn('buster-table-chart', className)}
      key={data.length}
      rows={data}
      columnOrder={tableColumnOrder || undefined}
      columnWidths={tableColumnWidths || undefined}
      sortable={!readOnly}
      resizable={!readOnly}
      draggable={!readOnly}
      onReady={onReady}
      headerFormat={onFormatHeader}
      cellFormat={onFormatCell}
      onReorderColumns={onUpdateTableColumnOrder}
      onResizeColumns={onUpdateTableColumnSize}
    />
  );
};

export const BusterTableChart = React.memo(BusterTableChartBase);

export default BusterTableChart;
