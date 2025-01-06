import React, { useEffect, useTransition } from 'react';
import { ChartJSOrUndefined } from '../../core/types';
import {
  BusterChartProps,
  ChartEncodes,
  ChartType,
  ComboChartAxis
} from '@/components/charts/interfaces';
import { useDebounceFn, useMemoizedFn, useWhyDidYouUpdate } from 'ahooks';
import { IBusterThreadMessageChartConfig } from '@/api/busterv2';
import {
  addLegendHeadlines,
  BusterChartLegendItem,
  useBusterChartLegend,
  UseChartLengendReturnValues
} from '@/components/charts/BusterChartLegend';
import { getLegendItems } from './helper';
import { DatasetOption } from '@/components/charts/chartHooks';

interface UseBusterChartJSLegendProps {
  chartRef: React.RefObject<ChartJSOrUndefined>;
  colors: NonNullable<BusterChartProps['colors']>;
  showLegend: boolean | null | undefined;
  selectedChartType: ChartType;
  chartMounted: boolean;
  selectedAxis: ChartEncodes | undefined;
  showLegendHeadline: IBusterThreadMessageChartConfig['showLegendHeadline'] | undefined;
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>;
  loading: boolean;
  lineGroupType: BusterChartProps['lineGroupType'];
  barGroupType: BusterChartProps['barGroupType'];
  datasetOptions: DatasetOption[];
  columnSettings: NonNullable<BusterChartProps['columnSettings']>;
  columnMetadata: NonNullable<BusterChartProps['columnMetadata']>;
  pieMinimumSlicePercentage: NonNullable<BusterChartProps['pieMinimumSlicePercentage']>;
}

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
  columnSettings
}: UseBusterChartJSLegendProps): UseChartLengendReturnValues => {
  const [isTransitioning, startTransition] = useTransition();
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

  const { run: calculateLegendItems } = useDebounceFn(
    () => {
      if (showLegend === false) return;

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
          selectedChartType
        );
      }

      startTransition(() => {
        setLegendItems(items);
      });
    },
    {
      wait: 100
    }
  );

  const onHoverItem = useMemoizedFn((item: BusterChartLegendItem, isHover: boolean) => {
    const chartjs = chartRef.current;
    if (!chartjs) return;

    const data = chartjs.data;
    const index = data.labels?.indexOf(item.id) || 0;

    if (isHover && index !== -1) {
      chartjs.setActiveElements([{ datasetIndex: 0, index }]);
    } else if (index !== -1) {
      const filteredActiveElements = chartjs
        .getActiveElements()
        .filter((element) => element.datasetIndex === 0 && element.index === index);
      chartjs.setActiveElements(filteredActiveElements);
    }

    chartjs.update();
  });

  const onLegendItemClick = useMemoizedFn((item: BusterChartLegendItem) => {
    const chartjs = chartRef.current;
    if (!chartjs) return;

    const data = chartjs.data;

    if (selectedChartType === 'pie') {
      const index = data.labels?.indexOf(item.id) || 0;
      // Pie and doughnut charts only have a single dataset and visibility is per item
      chartjs.toggleDataVisibility(index);
    } else if (selectedChartType) {
      const index = data.datasets?.findIndex((dataset) => dataset.label === item.id);
      if (index !== -1) {
        chartjs.setDatasetVisibility(index, !chartjs.isDatasetVisible(index));
      }
    }
    chartjs.update();

    setInactiveDatasets((prev) => ({
      ...prev,
      [item.id]: prev[item.id] ? !prev[item.id] : true
    }));
  });

  const onLegendItemFocus = useMemoizedFn((item: BusterChartLegendItem) => {
    //  console.log('onLegendItemFocus', item);
    alert('TODO');
  });

  useEffect(() => {
    calculateLegendItems();
  }, [
    colors,
    isStackPercentage,
    showLegend,
    selectedChartType,
    chartMounted,
    inactiveDatasets,
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
    inactiveDatasets
  };
};
