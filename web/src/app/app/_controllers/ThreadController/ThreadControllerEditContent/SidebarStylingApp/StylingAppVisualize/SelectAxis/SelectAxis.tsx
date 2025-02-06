import React, { useMemo } from 'react';
import { DropZone, SelectAxisDropzones, SelectAxisItem } from './SelectAxisDragContainer';
import { IBusterThreadMessageChartConfig } from '@/api/buster_rest';
import { getChartTypeDropZones } from './helper';
import { ISelectAxisContext, SelectAxisProvider } from './useSelectAxisContext';
import { useMemoizedFn, useWhyDidYouUpdate } from 'ahooks';
import { useBusterThreadsContextSelector } from '@/context/Threads';
import { chartTypeToAxis, zoneIdToAxis } from './config';
import {
  CategoryAxisStyleConfig,
  ChartEncodes,
  XAxisConfig,
  Y2AxisConfig,
  YAxisConfig
} from '@/components/charts';
import isEmpty from 'lodash/isEmpty';
import { SelectAxisEmptyState } from './SelectAxisEmptyState';

export const SelectAxis: React.FC<
  Required<YAxisConfig> &
    Required<Omit<XAxisConfig, 'xAxisTimeInterval'>> &
    Required<CategoryAxisStyleConfig> &
    Required<Y2AxisConfig> &
    ISelectAxisContext
> = React.memo(({ selectedChartType, columnMetadata, selectedAxis, ...props }) => {
  const onUpdateMessageChartConfig = useBusterThreadsContextSelector(
    (x) => x.onUpdateMessageChartConfig
  );

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
      return { ...acc, [axis]: zone.items };
    }, {} as ChartEncodes);

    const newChartConfig: Partial<IBusterThreadMessageChartConfig> = {
      [selectedAxisToEdit]: newChartEncodes
    };

    onUpdateMessageChartConfig({
      chartConfig: newChartConfig
    });
  });

  if (isEmpty(items)) {
    return <SelectAxisEmptyState />;
  }

  return (
    <div id="select-axis-container">
      <SelectAxisProvider
        {...props}
        selectedAxis={selectedAxis}
        selectedChartType={selectedChartType}
        columnMetadata={columnMetadata}>
        <SelectAxisDropzones items={items} dropZones={dropZones} onChange={onChange} />
      </SelectAxisProvider>
    </div>
  );
});
SelectAxis.displayName = 'SelectAxis';
