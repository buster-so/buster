/** biome-ignore-all lint/style/noNonNullAssertion: false positive */

import round from 'lodash/round';
import { useMemo } from 'react';
import type { BusterChartProps } from '../../../BusterChart.types';

const MIN_PERCENT_DIFFERENCE = 2;
const MAX_PERCENT_DIFFERENCE = 2;
const MIN_OFFSET = 1.1;
const MAX_OFFSET = 1.1;
const PERCENTAGE_STEP = 5;

export const useYTickValues = ({
  hasY2Axis,
  columnMetadata,
  selectedChartType,
  yAxisKeys,
  y2AxisKeys,
  columnLabelFormats,
}: {
  hasY2Axis: boolean;
  columnMetadata: BusterChartProps['columnMetadata'];
  selectedChartType: BusterChartProps['selectedChartType'];
  yAxisKeys: string[];
  y2AxisKeys: string[];
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>;
}) => {
  const shouldUseMinAndMaxValues = hasY2Axis && columnMetadata && selectedChartType === 'combo';

  const checkValues = useMemo(() => {
    if (!shouldUseMinAndMaxValues) return [];
    return [...yAxisKeys, ...y2AxisKeys];
  }, [yAxisKeys, y2AxisKeys, shouldUseMinAndMaxValues]);

  const hasOnePercentageValue = useMemo(() => {
    if (!shouldUseMinAndMaxValues) return false;
    return checkValues.some((key) => {
      const columnFormat = columnLabelFormats[key];
      return columnFormat?.style === 'percent';
    });
  }, [checkValues, columnLabelFormats, shouldUseMinAndMaxValues]);

  const allYValuesArePercentage = useMemo(() => {
    if (!shouldUseMinAndMaxValues) return false;
    return checkValues.every((key) => {
      const columnFormat = columnLabelFormats[key];
      return columnFormat?.style === 'percent';
    });
  }, [checkValues, columnLabelFormats, shouldUseMinAndMaxValues]);

  const columnMap = useMemo(() => {
    if (!columnMetadata || !shouldUseMinAndMaxValues) return new Map();
    return new Map(columnMetadata.map((col) => [col.name, col]));
  }, [columnMetadata, shouldUseMinAndMaxValues]);

  // Calculate min/max ranges for y-axis columns
  const yAxisRange = useMemo(() => {
    if (!shouldUseMinAndMaxValues) return { min: Infinity, max: -Infinity };
    return yAxisKeys.reduce(
      (acc, key) => {
        const column = columnMap.get(key);
        if (!column) return acc;
        const min = Number(column.min_value ?? 0);
        const max = Number(column.max_value ?? 0);
        return {
          min: Math.min(acc.min, min),
          max: Math.max(acc.max, max),
        };
      },
      { min: Infinity, max: -Infinity }
    );
  }, [yAxisKeys, columnMap, shouldUseMinAndMaxValues]);

  // Calculate min/max ranges for y2-axis columns
  const y2AxisRange = useMemo(() => {
    if (!shouldUseMinAndMaxValues) return { min: Infinity, max: -Infinity };
    return y2AxisKeys.reduce(
      (acc, key) => {
        const column = columnMap.get(key);
        if (!column) return acc;
        const min = Number(column.min_value ?? 0);
        const max = Number(column.max_value ?? 0);
        return {
          min: Math.min(acc.min, min),
          max: Math.max(acc.max, max),
        };
      },
      { min: Infinity, max: -Infinity }
    );
  }, [y2AxisKeys, columnMap, shouldUseMinAndMaxValues]);

  const minTickValue: number | undefined = useMemo(() => {
    if (!shouldUseMinAndMaxValues) return undefined;

    // If all Y values are percentages, return the lowest value
    if (allYValuesArePercentage) {
      const lowestValue = checkValues.reduce((min, key) => {
        const column = columnMap.get(key);
        return Math.min(min, Number(column?.min_value ?? 0));
      }, Infinity);
      if (lowestValue === Infinity) return undefined;
      if (lowestValue > 0) return 0;
      return lowestValue;
    }

    // Reset infinities if no valid data found
    if (yAxisRange.min === Infinity) yAxisRange.min = 0;
    if (yAxisRange.max === -Infinity) yAxisRange.max = 0;
    if (y2AxisRange.min === Infinity) y2AxisRange.min = 0;
    if (y2AxisRange.max === -Infinity) y2AxisRange.max = 0;

    // Check if min values are within 130% of each other
    const minValuesAreSimilar =
      Math.abs(yAxisRange.min) > 0 && Math.abs(y2AxisRange.min) > 0
        ? Math.max(yAxisRange.min, y2AxisRange.min) / Math.min(yAxisRange.min, y2AxisRange.min) <=
          MIN_PERCENT_DIFFERENCE
        : yAxisRange.min === y2AxisRange.min;

    // Check if max values are within 130% of each other
    const maxValuesAreSimilar =
      Math.abs(yAxisRange.max) > 0 && Math.abs(y2AxisRange.max) > 0
        ? Math.max(yAxisRange.max, y2AxisRange.max) / Math.min(yAxisRange.max, y2AxisRange.max) <=
          MIN_PERCENT_DIFFERENCE
        : yAxisRange.max === y2AxisRange.max;

    // If both min and max values are similar, use the lowest min value
    if (minValuesAreSimilar && maxValuesAreSimilar) {
      if (hasOnePercentageValue) {
        // If there's at least one percentage value, round the min to the nearest lower multiple of 5
        const min = Math.min(yAxisRange.min, y2AxisRange.min) * MIN_OFFSET;
        return Math.floor(min / PERCENTAGE_STEP) * PERCENTAGE_STEP;
      }

      return round(Math.min(yAxisRange.min, y2AxisRange.min) * MIN_OFFSET, 0);
    }
  }, [
    hasOnePercentageValue,
    columnLabelFormats,
    yAxisRange,
    y2AxisRange,
    shouldUseMinAndMaxValues,
    columnMap,
    checkValues,
    allYValuesArePercentage,
  ]);

  const maxTickValue: number | undefined = useMemo(() => {
    if (!shouldUseMinAndMaxValues) return undefined;

    // If all Y values are percentages, return the highest value
    if (allYValuesArePercentage) {
      const highestValue = checkValues.reduce((max, key) => {
        const column = columnMap.get(key);
        return Math.max(max, Number(column?.max_value ?? 0));
      }, -Infinity);
      if (highestValue === -Infinity) return undefined;
      if (highestValue < 1) return 1;
      return highestValue;
    }

    // Reset infinities if no valid data found
    if (yAxisRange.min === Infinity) yAxisRange.min = 0;
    if (yAxisRange.max === -Infinity) yAxisRange.max = 0;
    if (y2AxisRange.min === Infinity) y2AxisRange.min = 0;
    if (y2AxisRange.max === -Infinity) y2AxisRange.max = 0;

    // Check if min values are within 150% of each other
    const minValuesAreSimilar =
      Math.abs(yAxisRange.min) > 0 && Math.abs(y2AxisRange.min) > 0
        ? Math.max(yAxisRange.min, y2AxisRange.min) / Math.min(yAxisRange.min, y2AxisRange.min) <=
          MIN_PERCENT_DIFFERENCE
        : yAxisRange.min === y2AxisRange.min;

    // Check if max values are within 200% of each other
    const maxValuesAreSimilar =
      Math.abs(yAxisRange.max) > 0 && Math.abs(y2AxisRange.max) > 0
        ? Math.max(yAxisRange.max, y2AxisRange.max) / Math.min(yAxisRange.max, y2AxisRange.max) <=
          MAX_PERCENT_DIFFERENCE
        : yAxisRange.max === y2AxisRange.max;

    // If both min and max values are similar, use the highest max value
    if (minValuesAreSimilar && maxValuesAreSimilar) {
      if (hasOnePercentageValue) {
        // If there's at least one percentage value, round the max to the nearest higher multiple of 5
        const max = Math.max(yAxisRange.max, y2AxisRange.max) * MAX_OFFSET;
        return Math.ceil(max / PERCENTAGE_STEP) * PERCENTAGE_STEP;
      }

      return round(Math.max(yAxisRange.max, y2AxisRange.max) * MAX_OFFSET, 0);
    }
  }, [
    hasOnePercentageValue,
    columnLabelFormats,
    yAxisRange,
    y2AxisRange,
    shouldUseMinAndMaxValues,
    columnMap,
    checkValues,
    allYValuesArePercentage,
  ]);

  return {
    minTickValue,
    maxTickValue,
  };
};
