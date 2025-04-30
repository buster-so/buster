'use client';

import React, { useEffect, useMemo, useState, useTransition } from 'react';
import { ChartJSOrUndefined } from '../../core/types';
import {
  BusterChartProps,
  ChartEncodes,
  ChartType,
  ComboChartAxis
} from '@/api/asset_interfaces/metric/charts';
import { useDebounceEffect, useDebounceFn, useMemoizedFn } from '@/hooks';
import type { IBusterMetricChartConfig } from '@/api/asset_interfaces/metric';
import {
  addLegendHeadlines,
  BusterChartLegendItem,
  useBusterChartLegend,
  UseChartLengendReturnValues
} from '../../../BusterChartLegend';
import { getLegendItems } from './getLegendItems';
import { DatasetOptionsWithTicks } from '../../../chartHooks';
import { LEGEND_ANIMATION_THRESHOLD } from '../../../config';
import { timeout } from '@/lib';

interface UseBusterChartJSLegendProps {
  chartRef: React.RefObject<ChartJSOrUndefined | null>;
  colors: NonNullable<BusterChartProps['colors']>;
  showLegend: boolean | null | undefined;
  selectedChartType: ChartType;
  chartMounted: boolean;
  selectedAxis: ChartEncodes | undefined;
  showLegendHeadline: IBusterMetricChartConfig['showLegendHeadline'] | undefined;
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>;
  loading: boolean;
  lineGroupType: BusterChartProps['lineGroupType'];
  barGroupType: BusterChartProps['barGroupType'];
  datasetOptions: DatasetOptionsWithTicks;
  columnSettings: NonNullable<BusterChartProps['columnSettings']>;
  columnMetadata: NonNullable<BusterChartProps['columnMetadata']>;
  pieMinimumSlicePercentage: NonNullable<BusterChartProps['pieMinimumSlicePercentage']>;
  numberOfDataPoints: number;
  animateLegend?: boolean;
}

const DELAY_DURATION_FOR_LARGE_DATASET = 95; //95

export const useBusterChartJSLegend = ({
  chartRef,
  colors,
  selectedAxis,
  showLegend: showLegendProp,
  selectedChartType,
  chartMounted,
  showLegendHeadline,
  columnLabelFormats,
  loading,
  lineGroupType,
  pieMinimumSlicePercentage,
  barGroupType,
  datasetOptions,
  columnMetadata,
  animateLegend: animateLegendProp,
  columnSettings,
  numberOfDataPoints
}: UseBusterChartJSLegendProps): UseChartLengendReturnValues => {
  const [isPending, startTransition] = useTransition();
  const [isUpdatingChart, setIsUpdatingChart] = useState(false);
  const isLargeDataset = numberOfDataPoints > LEGEND_ANIMATION_THRESHOLD;
  const legendTimeoutDuration = isLargeDataset ? DELAY_DURATION_FOR_LARGE_DATASET : 0;

  const {
    inactiveDatasets,
    setInactiveDatasets,
    legendItems,
    setLegendItems,
    renderLegend,
    isStackPercentage,
    showLegend,
    allYAxisColumnNames
  } = useBusterChartLegend({
    selectedChartType,
    showLegendProp,
    selectedAxis,
    loading,
    lineGroupType,
    barGroupType
  });

  const categoryAxisColumnNames = (selectedAxis as ComboChartAxis).category as string[];

  const animateLegend = useMemo(() => {
    return !!animateLegendProp && numberOfDataPoints <= LEGEND_ANIMATION_THRESHOLD;
  }, [animateLegendProp, numberOfDataPoints]);

  const calculateLegendItems = useMemoizedFn(() => {
    if (showLegend === false) return;

    // Defer the actual calculation to the next animation frame
    requestAnimationFrame(() => {
      const items = getLegendItems({
        chartRef,
        colors,
        inactiveDatasets,
        selectedChartType,
        allYAxisColumnNames,
        columnLabelFormats,
        categoryAxisColumnNames,
        columnSettings
      });

      if (!isStackPercentage && showLegendHeadline) {
        addLegendHeadlines(
          items,
          datasetOptions,
          showLegendHeadline,
          columnMetadata,
          columnLabelFormats,
          selectedChartType,
          selectedAxis?.x || []
        );
      }

      startTransition(() => {
        setLegendItems(items);
      });
    });
  });

  const onHoverItem = useMemoizedFn((item: BusterChartLegendItem, isHover: boolean) => {
    const chartjs = chartRef.current;
    if (!chartjs) return;
    if (chartjs.options.animation === false) return;

    const data = chartjs.data;
    const hasMultipleDatasets = data.datasets?.length > 1;
    const assosciatedDatasetIndex = data.datasets?.findIndex(
      (dataset) => dataset.label === item.id
    );
    const index = !hasMultipleDatasets ? data.labels?.indexOf(item.id) || -1 : 0;

    if (isHover && index !== -1) {
      const allElementsAssociatedWithDataset = chartjs.getDatasetMeta(assosciatedDatasetIndex).data;
      const activeElements = allElementsAssociatedWithDataset.map((item, index) => {
        return {
          datasetIndex: assosciatedDatasetIndex,
          index
        };
      });
      chartjs.setActiveElements(activeElements);
    } else if (index !== -1) {
      const filteredActiveElements = chartjs
        .getActiveElements()
        .filter(
          (element) => element.datasetIndex === assosciatedDatasetIndex && element.index === index
        );
      chartjs.setActiveElements(filteredActiveElements);
    }

    chartjs.update();
  });

  const { run: debouncedChartUpdate } = useDebounceFn(
    useMemoizedFn((timeoutDuration: number) => {
      const chartjs = chartRef.current;
      if (!chartjs) return;
      // Schedule the heavy update operation with minimal delay to allow UI to remain responsive
      setTimeout(() => {
        startTransition(() => {
          chartjs.update();

          // Set a timeout to turn off loading state after the update is complete
          requestAnimationFrame(() => {
            setIsUpdatingChart(false);
          });
        });
      }, timeoutDuration);
    }),
    { wait: isLargeDataset ? DELAY_DURATION_FOR_LARGE_DATASET * 2.5 : 0 }
  );

  const onLegendItemClick = useMemoizedFn(async (item: BusterChartLegendItem) => {
    const chartjs = chartRef.current;

    if (!chartjs) return;
    const data = chartjs.data;

    // Set updating state
    if (legendTimeoutDuration) setIsUpdatingChart(true);

    // Update dataset visibility state
    setInactiveDatasets((prev) => ({
      ...prev,
      [item.id]: prev[item.id] ? !prev[item.id] : true
    }));

    await timeout(legendTimeoutDuration);

    // Defer visual updates to prevent UI blocking
    requestAnimationFrame(() => {
      // This is a synchronous, lightweight operation that toggles visibility flags
      if (selectedChartType === 'pie') {
        const index = data.labels?.indexOf(item.id) || 0;
        chartjs.toggleDataVisibility(index);
      } else if (selectedChartType) {
        const index = data.datasets?.findIndex((dataset) => dataset.label === item.id);
        if (index !== -1) {
          chartjs.setDatasetVisibility(index, !chartjs.isDatasetVisible(index));
        }
      }

      debouncedChartUpdate(legendTimeoutDuration);
    });
  });

  const onLegendItemFocus = useMemoizedFn(async (item: BusterChartLegendItem) => {
    const chartjs = chartRef.current;
    if (!chartjs) return;

    if (legendTimeoutDuration) setIsUpdatingChart(true);

    // Defer visual updates to prevent UI blocking
    requestAnimationFrame(() => {
      const datasets = chartjs.data.datasets.filter((dataset) => !dataset.hidden);
      const hasMultipleDatasets = datasets?.length > 1;
      const assosciatedDatasetIndex = datasets?.findIndex((dataset) => dataset.label === item.id);

      if (hasMultipleDatasets) {
        const hasOtherDatasetsVisible = datasets?.some(
          (dataset, index) =>
            dataset.label !== item.id && chartjs.isDatasetVisible(index) && !dataset.hidden
        );
        const inactiveDatasetsRecord: Record<string, boolean> = {};
        if (hasOtherDatasetsVisible) {
          datasets?.forEach((dataset, index) => {
            const value = index === assosciatedDatasetIndex;
            chartjs.setDatasetVisibility(index, value);
            inactiveDatasetsRecord[dataset.label!] = !value;
          });
        } else {
          datasets?.forEach((dataset, index) => {
            chartjs.setDatasetVisibility(index, true);
            inactiveDatasetsRecord[dataset.label!] = false;
          });
        }
        setInactiveDatasets((prev) => ({
          ...prev,
          ...inactiveDatasetsRecord
        }));
      }

      debouncedChartUpdate(legendTimeoutDuration);
    });
  });

  useDebounceEffect(
    () => {
      calculateLegendItems();
    },
    [selectedChartType],
    { wait: 5 }
  );

  //immediate items
  useEffect(() => {
    calculateLegendItems();
  }, [
    chartMounted,
    isStackPercentage,
    inactiveDatasets,
    showLegend,
    colors,
    showLegendHeadline,
    columnLabelFormats,
    allYAxisColumnNames,
    columnSettings,
    pieMinimumSlicePercentage
  ]);

  return {
    renderLegend,
    legendItems,
    onHoverItem,
    onLegendItemClick,
    onLegendItemFocus: selectedChartType === 'pie' ? undefined : onLegendItemFocus,
    showLegend,
    inactiveDatasets,
    isUpdatingChart,
    animateLegend
  };
};
