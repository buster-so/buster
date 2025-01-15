import React, { useEffect, useMemo, useRef } from 'react';
import {
  addLegendHeadlines,
  BusterChartLegendItem,
  useBusterChartLegend,
  UseChartLengendReturnValues
} from '../../../BusterChartLegend';
import type { EChartsInstance } from 'echarts-for-react';
import type { SeriesOption } from 'echarts';
import { getLegendItems } from './helpers';
import {
  BusterChartConfigProps,
  BusterChartProps,
  ChartEncodes,
  ChartType,
  ShowLegendHeadline
} from '../../../interfaces';
import { useDebounceFn, useMemoizedFn } from 'ahooks';
import { DEFAULT_CHART_CONFIG } from '@/api/buster-rest';
import { DatasetOption, TRENDLINE_DELIMETER } from '../../../chartHooks';
import { GOAL_LINE_DELIMETER } from '../useSeriesOptions/useGoalLines';

export const useBusterEChartLegend = ({
  chartMounted,
  columnLabelFormats = DEFAULT_CHART_CONFIG.columnLabelFormats,
  chartRef,
  selectedChartType,
  showLegend: showLegendProp = DEFAULT_CHART_CONFIG.showLegend,
  selectedAxis,
  showLegendHeadline = DEFAULT_CHART_CONFIG.showLegendHeadline,
  columnSettings,
  columnMetadata,
  lineGroupType,
  barGroupType,
  colors,
  loading
}: {
  columnSettings: NonNullable<BusterChartConfigProps['columnSettings']>;
  columnLabelFormats: NonNullable<BusterChartConfigProps['columnLabelFormats']>;
  chartMounted: boolean;
  chartRef: React.RefObject<EChartsInstance>;
  selectedChartType: NonNullable<BusterChartProps['selectedChartType']>;
  showLegend: BusterChartProps['showLegend'];
  showLegendHeadline: ShowLegendHeadline | undefined;
  selectedAxis: ChartEncodes | undefined;
  columnMetadata: NonNullable<BusterChartProps['columnMetadata']>;
  lineGroupType: BusterChartProps['lineGroupType'];
  barGroupType: BusterChartProps['barGroupType'];
  colors: string[];
  loading: boolean;
}): UseChartLengendReturnValues => {
  const {
    inactiveDatasets,
    setInactiveDatasets,
    legendItems,
    setLegendItems,
    renderLegend,
    isStackPercentage,
    showLegend,
    categoryAxisColumnNames,
    allYAxisColumnNames
  } = useBusterChartLegend({
    selectedChartType,
    showLegendProp,
    loading,
    lineGroupType,
    barGroupType,
    selectedAxis
  });

  const computeKeyRef = useRef<string>('');

  //This avoids the race condition when chart types are switched
  const { run: calculateLegendItems } = useDebounceFn(
    useMemoizedFn(() => {
      if (showLegend === false) return;

      const chartInstance = chartRef.current?.getEchartsInstance?.();
      const computeKey = createComputeKey(
        columnLabelFormats,
        allYAxisColumnNames,
        categoryAxisColumnNames,
        showLegendHeadline,
        inactiveDatasets,
        isStackPercentage,
        colors
      );

      if (chartMounted && chartInstance && computeKeyRef.current !== computeKey) {
        const chartOption = chartInstance.getOption();
        const colors = chartOption.color as string[];
        const datasets = chartOption?.dataset as DatasetOption[];
        const series = chartOption.series as SeriesOption[];
        const filteredSeries = series.filter((series) => {
          return (
            !(series.name as string)?.includes?.(TRENDLINE_DELIMETER) &&
            !(series.name as string)?.includes?.(GOAL_LINE_DELIMETER)
          );
        });

        const items = getLegendItems({
          colors,
          datasets,
          series: filteredSeries,
          allYAxisColumnNames,
          columnLabelFormats,
          inactiveDatasets,
          selectedChartType
        });

        if (!isStackPercentage && showLegendHeadline) {
          addLegendHeadlines(
            items,
            datasets,
            showLegendHeadline,
            columnMetadata,
            columnLabelFormats,
            selectedChartType
          );
        }
        setLegendItems(items);

        computeKeyRef.current = computeKey;
      }
    }),
    { wait: legendItems.length > 0 ? 100 : 0 }
  );

  const onHoverItem = useMemoizedFn((item: BusterChartLegendItem, isHover: boolean) => {
    const chart = chartRef.current?.getEchartsInstance();

    if (chart && chartMounted) {
      const isPieChart = selectedChartType === 'pie';
      const { id } = item;
      const seriesName = item.serieName; //used for pie charts
      const action = isHover ? 'highlight' : 'downplay';
      const payload = isPieChart ? { name: id, seriesName } : { seriesName: id };

      chart?.dispatchAction?.({
        type: action,
        ...payload
      });
    }
  });

  const onLegendItemClick = useMemoizedFn((item: BusterChartLegendItem) => {
    const chart = chartRef.current?.getEchartsInstance();

    const isPieChart = selectedChartType === 'pie';
    const id = item.id;
    const seriesName = item.serieName; //used for pie charts
    const acitveDatasetId = isPieChart ? id + seriesName : id;
    const isInactive = inactiveDatasets[acitveDatasetId] ?? false;
    setInactiveDatasets((prev) => ({
      ...prev,
      [acitveDatasetId]: !isInactive
    }));

    const actionType = !isInactive ? 'legendUnSelect' : 'legendSelect';

    chart?.dispatchAction({
      seriesName,
      type: actionType,
      name: id
    });

    //if the item is active, turn off hover. This is to prevent the hover from persisting when the item is clicked.
    if (!isInactive) {
      onHoverItem(item, false);
    }
  });

  const onLegendItemFocus = useMemoizedFn((item: BusterChartLegendItem) => {
    const inactive = item.inactive;
    const chart = chartRef.current?.getEchartsInstance();
    const numberOfActives = legendItems.filter((item) => !item.inactive).length;

    //if there is only one active dataset AND the clicked item is active, then turn all datasets active
    if (numberOfActives === 1 && !inactive) {
      chart?.dispatchAction({
        type: 'legendAllSelect'
      });
      setInactiveDatasets({});
      return;
    }

    legendItems.forEach((legendItem) => {
      const type = legendItem.id === item.id ? 'legendSelect' : 'legendUnSelect';
      chart?.dispatchAction({
        type,
        name: legendItem.id
      });
    });
    setInactiveDatasets((prev) => {
      return legendItems.reduce<Record<string, boolean>>((acc, legendItem) => {
        acc[legendItem.id] = legendItem.id !== item.id;
        return acc;
      }, {});
    });
  });

  const settingsTrigger = useMemo(() => {
    if (selectedChartType === ChartType.Combo) {
      return Object.values(columnSettings)
        .map((setting) => setting.columnVisualization)
        .join(',');
    }
    return false;
  }, [columnSettings, selectedChartType]);

  useEffect(() => {
    calculateLegendItems();
  }, [
    colors,
    isStackPercentage,
    settingsTrigger,
    showLegend,
    selectedChartType,
    chartMounted,
    inactiveDatasets,
    allYAxisColumnNames,
    showLegendHeadline,
    columnLabelFormats
  ]);

  return {
    legendItems,
    onLegendItemClick,
    onLegendItemFocus: selectedChartType === 'pie' ? undefined : onLegendItemFocus,
    onHoverItem,
    showLegend,
    renderLegend,
    inactiveDatasets
  };
};

const createComputeKey = (
  columnLabelFormats: NonNullable<BusterChartConfigProps['columnLabelFormats']>,
  allYAxisColumnNames: string[],
  categoryAxisColumnNames: string[] | undefined,
  showLegendHeadline: ShowLegendHeadline,
  inactiveDatasets: Record<string, boolean>,
  isStackPercentage: boolean,
  colors: string[]
): string => {
  return (
    [...allYAxisColumnNames, ...(categoryAxisColumnNames || [])]
      .map((columnName) => {
        return JSON.stringify(columnLabelFormats[columnName]);
      })
      .join('') +
    showLegendHeadline +
    JSON.stringify(inactiveDatasets) +
    isStackPercentage.toString() +
    colors.join(',')
  );
};
