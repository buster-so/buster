import type {
  CategoryAxisStyleConfig,
  ChartConfigProps,
  ChartEncodes,
  XAxisConfig,
  Y2AxisConfig,
  YAxisConfig,
} from '@buster/server-shared/metrics';
import isEmpty from 'lodash/isEmpty';
import React, { useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorCard } from '@/components/ui/error/ErrorCard';
import { useUpdateMetricChart } from '@/context/Metrics/useUpdateMetricChart';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
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
> = React.memo(({ selectedChartType, columnMetadata, selectedAxis, barLayout, ...props }) => {
  const { onUpdateMetricChartConfig } = useUpdateMetricChart({ metricId: props.metricId });

  const items: SelectAxisItem[] = useMemo(() => {
    return columnMetadata.map((column) => column.name);
  }, [columnMetadata]);

  const dropZones: DropZone[] = useMemo(() => {
    if (!isEmpty(selectedAxis) && !isEmpty(items)) {
      return getChartTypeDropZones({ chartType: selectedChartType, selectedAxis, barLayout });
    }
    return [];
  }, [selectedAxis, selectedChartType, items]);

  const onChange = useMemoizedFn((dropZones: DropZone[]) => {
    const selectedAxisToEdit = chartTypeToAxis[selectedChartType];
    if (!selectedAxisToEdit) return;

    const newChartEncodes: Partial<ChartEncodes> = dropZones.reduce<ChartEncodes>((acc, zone) => {
      const axis = zoneIdToAxis[zone.id];
      acc[axis as keyof ChartEncodes] = zone.items;
      return acc;
    }, {} as ChartEncodes);

    const newChartConfig: Partial<ChartConfigProps> = {
      [selectedAxisToEdit]: newChartEncodes,
    };

    onUpdateMetricChartConfig({
      chartConfig: newChartConfig,
    });
  });

  const memoizedErrorComponent = useMemo(() => {
    return (
      <ErrorCard message="There was an error loading the chart config. Please contact Buster support." />
    );
  }, []);

  if (isEmpty(items)) {
    return <SelectAxisEmptyState />;
  }

  return (
    <ErrorBoundary fallback={memoizedErrorComponent}>
      <SelectAxisProvider
        {...props}
        selectedAxis={selectedAxis}
        selectedChartType={selectedChartType}
        columnMetadata={columnMetadata}
        barLayout={barLayout}
      >
        <SelectAxisDropzones items={items} dropZones={dropZones} onChange={onChange} />
      </SelectAxisProvider>
    </ErrorBoundary>
  );
});
SelectAxis.displayName = 'SelectAxis';
