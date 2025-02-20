import React, { useEffect, useTransition } from 'react';
import { ChartJSOrUndefined } from '../../core/types';
import {
  BusterChartProps,
  ChartEncodes,
  ChartType,
  ComboChartAxis
} from '@/components/charts/interfaces';
import { useDebounceFn, useMemoizedFn, useWhyDidYouUpdate } from 'ahooks';
import { IBusterThreadMessageChartConfig } from '@/api/buster_rest';
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
      wait: 125
    }
  );

  const onHoverItem = useMemoizedFn((item: BusterChartLegendItem, isHover: boolean) => {
    const chartjs = chartRef.current;
    if (!chartjs) return;

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
    const chartjs = chartRef.current;
    if (!chartjs) return;

    const datasets = chartjs.data.datasets;
    const hasMultipleDatasets = datasets?.length > 1;
    const assosciatedDatasetIndex = datasets?.findIndex((dataset) => dataset.label === item.id);

    if (hasMultipleDatasets) {
      const hasOtherDatasetsVisible = datasets?.some(
        (dataset, index) => dataset.label !== item.id && chartjs.isDatasetVisible(index)
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

    chartjs.update();
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
