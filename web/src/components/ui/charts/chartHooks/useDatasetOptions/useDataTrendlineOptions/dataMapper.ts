import type { BusterChartProps } from '@/api/asset_interfaces/metric';
import type { DatasetOption, DatasetOptionsWithTicks } from '../interfaces';
import { isDateColumnType } from '@/lib/messages';
import { createDayjsDate } from '@/lib/date';

type MappedDataResult = [number, number][]; // [x, y] pairs for regression

/**
 * Maps raw dataset values into [x, y] pairs suitable for regression analysis
 * Uses ticks for x-axis values and handles different data types appropriately
 */
export const dataMapper = (
  dataset: DatasetOption,
  ticks: Pick<DatasetOptionsWithTicks, 'ticks' | 'ticksKey'>,
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>
): MappedDataResult => {
  const xAxisColumn = dataset.dataKey;
  const xAxisIsDate = isDateColumnType(columnLabelFormats[xAxisColumn]?.columnType);

  // Filter out null/undefined values
  const validDataPoints = dataset.data
    .map((value, index) => ({
      value: Number(value || 0),
      tick: ticks.ticks[index]?.[0] // Use first tick value as x-axis value
    }))
    .filter(
      (point) => point.value !== null && point.value !== undefined && point.tick !== undefined
    );

  if (validDataPoints.length === 0) {
    return [];
  }

  const mappedData: [number, number][] = validDataPoints.map((point, index) => {
    const xValue = point.tick;

    // Handle different x-axis types
    let x: number;
    if (typeof xValue === 'number') {
      x = xValue;
    } else if (xAxisIsDate && xValue) {
      x = createDayjsDate(xValue).valueOf();
    } else {
      // For categorical data, use the index
      x = index;
    }

    return [x, point.value];
  });

  return mappedData;
};
