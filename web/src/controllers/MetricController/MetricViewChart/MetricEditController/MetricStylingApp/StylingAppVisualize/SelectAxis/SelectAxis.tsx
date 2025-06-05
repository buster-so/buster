import isEmpty from 'lodash/isEmpty';
import React, { useMemo } from 'react';
import type { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import type {
  CategoryAxisStyleConfig,
  ChartEncodes,
  XAxisConfig,
  Y2AxisConfig,
  YAxisConfig
} from '@/api/asset_interfaces/metric/charts';
import { ErrorBoundary } from '@/components/ui/error';
import { useUpdateMetricChart } from '@/context/Metrics';
import { useMemoizedFn } from '@/hooks';
import { chartTypeToAxis, zoneIdToAxis } from './config';
import { getChartTypeDropZones } from './helper';
import { type DropZone, SelectAxisDropzones, type SelectAxisItem } from './SelectAxisDragContainer';
import { SelectAxisEmptyState } from './SelectAxisEmptyState';
import { type ISelectAxisContext, SelectAxisProvider } from './useSelectAxisContext';

export const SelectAxis: React.FC<
  Required<YAxisConfig> &
    Required<Omit<XAxisConfig, 'xAxisTimeInterval'>> &
    Required<CategoryAxisStyleConfig> &
    Required<Y2AxisConfig> &
    ISelectAxisContext
> = React.memo(({ selectedChartType, columnMetadata, selectedAxis, ...props }) => {
  const { onUpdateMetricChartConfig } = useUpdateMetricChart();

  const items: SelectAxisItem[] = useMemo(() => {
    return columnMetadata.map((column) => column.name);
  }, [columnMetadata]);

  const dropZones: DropZone[] = useMemo(() => {
    if (!isEmpty(selectedAxis) && !isEmpty(items)) {
      return getChartTypeDropZones({ chartType: selectedChartType, selectedAxis });
    }
    return [];
  }, [selectedAxis, selectedChartType, items]);

  const onChange = useMemoizedFn((dropZones: DropZone[]) => {
    const selectedAxisToEdit = chartTypeToAxis[selectedChartType];
    if (!selectedAxisToEdit) return;

    const newChartEncodes: Partial<ChartEncodes> = dropZones.reduce<ChartEncodes>((acc, zone) => {
      const axis = zoneIdToAxis[zone.id];
      return Object.assign(acc, { [axis]: zone.items });
    }, {} as ChartEncodes);

    const newChartConfig: Partial<IBusterMetricChartConfig> = {
      [selectedAxisToEdit]: newChartEncodes
    };

    onUpdateMetricChartConfig({
      chartConfig: newChartConfig
    });
  });

  const memoizedErrorComponent = useMemo(() => {
    return (
      <div className="bg-danger-background flex min-h-28 items-center justify-center rounded border border-red-500">
        <span className="text-danger-foreground p-3 text-center">
          There was an error loading the chart config. Please contact Buster support.
        </span>
      </div>
    );
  }, []);

  if (isEmpty(items)) {
    return <SelectAxisEmptyState />;
  }

  return (
    <ErrorBoundary errorComponent={memoizedErrorComponent}>
      <SelectAxisProvider
        {...props}
        selectedAxis={selectedAxis}
        selectedChartType={selectedChartType}
        columnMetadata={columnMetadata}>
        <SelectAxisDropzones items={items} dropZones={dropZones} onChange={onChange} />
      </SelectAxisProvider>
    </ErrorBoundary>
  );
});
SelectAxis.displayName = 'SelectAxis';
