'use client';

import { useUpdateEffect } from '@/hooks/useUpdateEffect';
import type {
  ChartEncodes,
  ChartType,
  ComboChartAxis,
  ScatterAxis
} from '@buster/server-shared/metrics';
import { useMemo, useState } from 'react';
import { useLegendAutoShow } from '../../charts-shared/useLegendAutoShow';
import type { BusterChartProps } from '../BusterChart.types';
import {
  DEFAULT_CATEGORY_AXIS_COLUMN_NAMES,
  DEFAULT_X_AXIS_COLUMN_NAMES,
  DEFAULT_Y_AXIS_COLUMN_NAMES
} from './config';
import type { BusterChartLegendItem } from './interfaces';

interface UseBusterChartLegendProps {
  selectedChartType: ChartType;
  showLegendProp: BusterChartProps['showLegend'];
  loading: boolean;
  lineGroupType: BusterChartProps['lineGroupType'];
  barGroupType: BusterChartProps['barGroupType'];
  selectedAxis: ChartEncodes | undefined;
}

export const useBusterChartLegend = ({
  selectedChartType,
  showLegendProp,
  selectedAxis,
  loading,
  lineGroupType,
  barGroupType
}: UseBusterChartLegendProps) => {
  const [inactiveDatasets, setInactiveDatasets] = useState<Record<string, boolean>>({});
  const [legendItems, setLegendItems] = useState<BusterChartLegendItem[]>([]);

  const yAxisColumnNames = selectedAxis?.y ?? DEFAULT_Y_AXIS_COLUMN_NAMES;
  const y2AxisColumnNames = (selectedAxis as ComboChartAxis)?.y2 ?? DEFAULT_Y_AXIS_COLUMN_NAMES;

  // biome-ignore lint/correctness/useExhaustiveDependencies: join is better
  const allYAxisColumnNames = useMemo(() => {
    return [...yAxisColumnNames, ...y2AxisColumnNames];
  }, [yAxisColumnNames.join(''), y2AxisColumnNames.join(',')]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: join is better
  const xAxisColumnNames = useMemo(
    () => selectedAxis?.x ?? DEFAULT_X_AXIS_COLUMN_NAMES,
    [selectedAxis?.x?.join('')]
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: join is better
  const categoryAxisColumnNames = useMemo(
    () => (selectedAxis as ScatterAxis)?.category ?? DEFAULT_CATEGORY_AXIS_COLUMN_NAMES,
    [(selectedAxis as ScatterAxis)?.category?.join('')]
  );

  const showLegend = useLegendAutoShow({
    selectedChartType,
    showLegendProp,
    categoryAxisColumnNames,
    allYAxisColumnNames
  });

  const renderLegend = useMemo(() => {
    return selectedChartType !== 'metric' && !loading;
  }, [loading, selectedChartType]);

  const isStackPercentage = useMemo(() => {
    return (
      (selectedChartType === 'line' && lineGroupType === 'percentage-stack') ||
      (selectedChartType === 'bar' && barGroupType === 'percentage-stack')
    );
  }, [selectedChartType, lineGroupType, barGroupType]);

  useUpdateEffect(() => {
    setInactiveDatasets({});
  }, [allYAxisColumnNames, xAxisColumnNames, categoryAxisColumnNames]);

  return {
    inactiveDatasets,
    setInactiveDatasets,
    legendItems,
    setLegendItems,
    renderLegend,
    isStackPercentage,
    showLegend,
    categoryAxisColumnNames,
    allYAxisColumnNames
  };
};
