import React, { useCallback } from 'react';
import { BusterTableChartConfig } from './interfaces';
import { useBusterMetricsIndividualContextSelector } from '@/context/Metrics';
import { formatLabel } from '@/lib/columnFormatter';
import isEqual from 'lodash/isEqual';
import type { BusterChartPropsBase } from '../interfaces';
import { type IBusterMetricChartConfig, DEFAULT_CHART_CONFIG } from '@/api/asset_interfaces';
import { useMemoizedFn } from 'ahooks';
import { useChartWrapperContextSelector } from '../chartHooks/useChartWrapperProvider';
import AppDataGrid from '@/components/ui/table/AppDataGrid/AppDataGrid';

export interface BusterTableChartProps extends BusterTableChartConfig, BusterChartPropsBase {}

const BusterTableChartBase: React.FC<BusterTableChartProps> = ({
  className = '',
  onMounted,
  data,
  tableColumnOrder,
  columnLabelFormats = DEFAULT_CHART_CONFIG.columnLabelFormats,
  tableColumnWidths = DEFAULT_CHART_CONFIG.tableColumnWidths,
  editable = true,
  //TODO
  tableHeaderBackgroundColor,
  tableHeaderFontColor,
  isDarkMode,
  animate,
  onInitialAnimationEnd,
  tableColumnFontColor
}) => {
  const onUpdateMetricChartConfig = useBusterMetricsIndividualContextSelector(
    (x) => x.onUpdateMetricChartConfig
  );
  const containerWidth = useChartWrapperContextSelector(({ width }) => width);

  //THIS MUST BE A USE CALLBACK
  const onFormatHeader = useCallback(
    (value: any, columnName: string) => {
      return formatLabel(value, columnLabelFormats[columnName], true);
    },
    [columnLabelFormats]
  );
  //THIS MUST BE A USE CALLBACK
  const onFormatCell = useCallback(
    (value: any, columnName: string) => {
      return formatLabel(value, columnLabelFormats[columnName], false);
    },
    [columnLabelFormats]
  );

  const onUpdateTableColumnOrder = useMemoizedFn((columns: string[]) => {
    if (!editable) return;
    const config: Partial<IBusterMetricChartConfig> = {
      tableColumnOrder: columns
    };

    onUpdateMetricChartConfig({
      chartConfig: config
    });
  });

  const onUpdateTableColumnSize = useMemoizedFn((columns: { key: string; size: number }[]) => {
    if (!editable) return;
    const config: Partial<IBusterMetricChartConfig> = {
      tableColumnWidths: columns.reduce<Record<string, number>>((acc, { key, size }) => {
        acc[key] = size;
        return acc;
      }, {})
    };
    onUpdateMetricChartConfig({
      chartConfig: config
    });
  });

  const onReady = useMemoizedFn(() => {
    onMounted?.(); //I decided to remove this because it was causing a double render
    requestAnimationFrame(() => {
      onInitialAnimationEnd?.();
    });
  });

  return (
    <AppDataGrid
      key={data.length}
      rows={data}
      initialWidth={containerWidth}
      columnOrder={tableColumnOrder || undefined}
      columnWidths={tableColumnWidths || undefined}
      draggable={editable}
      resizable={true}
      onReady={onReady}
      headerFormat={onFormatHeader}
      cellFormat={onFormatCell}
      onReorderColumns={onUpdateTableColumnOrder}
      onResizeColumns={onUpdateTableColumnSize}
    />
  );
};

export const BusterTableChart = React.memo(BusterTableChartBase, (prev, next) => {
  return (
    isEqual(prev.data, next.data) &&
    isEqual(JSON.stringify(prev.columnLabelFormats), JSON.stringify(next.columnLabelFormats)) &&
    isEqual(prev.tableColumnOrder, next.tableColumnOrder)
  );
});

export default BusterTableChart;
