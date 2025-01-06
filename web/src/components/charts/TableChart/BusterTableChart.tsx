import React, { useCallback } from 'react';
import { BusterTableChartConfig } from './interfaces';
import { useBusterThreadsContextSelector } from '@/context/Threads';
import { formatLabel } from '@/utils';
import isEqual from 'lodash/isEqual';
import { BusterChartPropsBase } from '../interfaces';
import { IBusterThreadMessageChartConfig } from '@/api/busterv2/threads/threadConfigInterfaces';
import { DEFAULT_CHART_CONFIG } from '@/api/busterv2/threads/defaults';
import { useMemoizedFn } from 'ahooks';
import AppDataGrid from '@/components/table/AppDataGrid/AppDataGrid';
import { useChartWrapperContextSelector } from '../chartHooks/useChartWrapperProvider';

//I decided to remove this to make it a little faster?
// const AppDataGrid = dynamic(() => import('@/components/table/AppDataGrid'), {
//   ssr: false,
//   loading: () => (
//     <div className="h-full max-h-[600px] min-h-[500px]">
//       {/* <CircleSpinnerLoaderContainer /> */}
//     </div>
//   )
// });

export interface BusterTableChartProps extends BusterTableChartConfig, BusterChartPropsBase {}

const _BusterTableChart: React.FC<BusterTableChartProps> = ({
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
  const onUpdateMessageChartConfigChart = useBusterThreadsContextSelector(
    (x) => x.onUpdateMessageChartConfig
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
    const config: Partial<IBusterThreadMessageChartConfig> = {
      tableColumnOrder: columns
    };

    onUpdateMessageChartConfigChart({
      chartConfig: config
    });
  });

  const onUpdateTableColumnSize = useMemoizedFn((columns: { key: string; size: number }[]) => {
    if (!editable) return;
    const config: Partial<IBusterThreadMessageChartConfig> = {
      tableColumnWidths: columns.reduce<Record<string, number>>((acc, { key, size }) => {
        acc[key] = size;
        return acc;
      }, {})
    };
    onUpdateMessageChartConfigChart({
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

export const BusterTableChart = React.memo(_BusterTableChart, (prev, next) => {
  return (
    isEqual(prev.data, next.data) &&
    isEqual(JSON.stringify(prev.columnLabelFormats), JSON.stringify(next.columnLabelFormats)) &&
    isEqual(prev.tableColumnOrder, next.tableColumnOrder)
  );
});

export default BusterTableChart;
