import type {
  BusterChartProps,
  ChartEncodes,
  ComboChartAxis
} from '@/components/charts/interfaces';
import { DeepPartial } from 'utility-types';
import type { TooltipOptions } from 'chart.js';
import { useEffect, useMemo, useRef } from 'react';
import { useMemoizedFn, useUnmount } from 'ahooks';
import { ChartJSOrUndefined } from '../../../core/types';

import { renderToString } from 'react-dom/server';
import { BusterChartJSTooltip } from './BusterChartJSTooltip';
import { busterAppStyleConfig } from '@/styles';
import { DatasetOption, extractFieldsFromChain } from '@/components/charts/chartHooks';
import React from 'react';
import { isNumericColumnType } from '@/utils';

const token = busterAppStyleConfig.token!;

type TooltipContext = Parameters<TooltipOptions['external']>[0];

interface UseTooltipOptionsProps {
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>;
  columnSettings: NonNullable<BusterChartProps['columnSettings']>;
  selectedChartType: NonNullable<BusterChartProps['selectedChartType']>;
  tooltipKeys: string[];
  barGroupType: BusterChartProps['barGroupType'];
  lineGroupType: BusterChartProps['lineGroupType'];
  pieDisplayLabelAs: BusterChartProps['pieDisplayLabelAs'];
  selectedAxis: ChartEncodes;
  datasetOptions: DatasetOption[];
  hasMismatchedTooltipsAndMeasures: boolean;
  disableTooltip: boolean;
}

export const useTooltipOptions = ({
  columnLabelFormats,
  selectedChartType,
  tooltipKeys,
  barGroupType,
  lineGroupType,
  pieDisplayLabelAs,
  columnSettings,
  selectedAxis,
  datasetOptions,
  disableTooltip
}: UseTooltipOptionsProps): DeepPartial<TooltipOptions> => {
  const tooltipCache = useRef<Record<string, string>>({});

  const columnLabelFormatsString = useMemo(
    () => JSON.stringify(columnLabelFormats),
    [columnLabelFormats]
  );

  const mode: TooltipOptions['mode'] = useMemo(() => {
    if (selectedChartType === 'scatter') {
      return 'nearest';
    }

    if (selectedChartType === 'pie') {
      return 'nearest';
    }

    return 'index';
  }, [selectedChartType]);

  const selectedDataset = useMemo(() => {
    return datasetOptions[datasetOptions.length - 1];
  }, [datasetOptions, tooltipKeys]);

  const { hasCategoryAxis, hasMultipleMeasures } = useMemo(() => {
    const categoryAxis = (selectedAxis as ComboChartAxis).category;
    const allYAxis = [...selectedAxis.y, ...((selectedAxis as ComboChartAxis).y2 || [])];
    const hasMultipleMeasures = allYAxis.length > 1;
    return {
      hasCategoryAxis: !!categoryAxis && categoryAxis.length > 0,
      hasMultipleMeasures
    };
  }, [(selectedAxis as ComboChartAxis).category, selectedAxis]);

  const useGlobalPercentage = useMemo(() => {
    if (selectedChartType === 'pie') return pieDisplayLabelAs === 'percent';
    if (selectedChartType === 'bar') return barGroupType === 'percentage-stack';
    if (selectedChartType === 'line') return lineGroupType === 'percentage-stack';
    return false;
  }, [lineGroupType, pieDisplayLabelAs, selectedChartType, barGroupType]);

  const keyToUsePercentage: string[] = useMemo(() => {
    if (useGlobalPercentage)
      return tooltipKeys.filter((key) => {
        const extractedKey = extractFieldsFromChain(key).at(-1)?.key!;
        return isNumericColumnType(columnLabelFormats[extractedKey]?.columnType);
      });

    if (selectedChartType === 'bar') {
      return tooltipKeys.filter((key) => {
        const extractedKey = extractFieldsFromChain(key).at(-1)?.key!;
        return (
          columnSettings[extractedKey]?.showDataLabelsAsPercentage &&
          isNumericColumnType(columnLabelFormats[extractedKey]?.columnType)
        );
      });
    }

    return [];
  }, [useGlobalPercentage, selectedChartType, columnSettings, tooltipKeys]);

  const memoizedExternal = useMemoizedFn((context: TooltipContext) => {
    const key = createTooltipCacheKey(context.chart, keyToUsePercentage, columnLabelFormatsString);
    const matchedCacheItem = tooltipCache.current[key];
    const result = externalTooltip(
      context,
      columnLabelFormats,
      selectedChartType,
      matchedCacheItem,
      keyToUsePercentage,
      columnSettings,
      hasCategoryAxis,
      hasMultipleMeasures
    );

    if (result) {
      tooltipCache.current[key] = result;
    }
  });

  const tooltipOptions: DeepPartial<TooltipOptions> = useMemo(
    () => ({
      enabled: false,
      mode,
      external: disableTooltip ? undefined : memoizedExternal
    }),
    [mode, disableTooltip, memoizedExternal, selectedChartType]
  );

  useEffect(() => {
    tooltipCache.current = {};
  }, [selectedDataset]);

  useUnmount(() => {
    const tooltipEl = document.getElementById('buster-chartjs-tooltip');
    if (tooltipEl) tooltipEl.remove();
  });

  return tooltipOptions;
};

const createTooltipCacheKey = (
  chart: ChartJSOrUndefined,
  keyToUsePercentage: string[],
  columnLabelFormatsString: string
) => {
  if (!chart?.tooltip) return '';

  const parts = [
    //@ts-ignore
    chart.config.type,
    chart.tooltip.title.join(''),
    chart.tooltip.body?.map((b) => b.lines.join('')).join(''),
    keyToUsePercentage.join(''),
    columnLabelFormatsString
  ];

  return parts.join('');
};

const getOrCreateInitialTooltipContainer = (chart: ChartJSOrUndefined) => {
  if (!chart) return null;

  let tooltipEl = document.getElementById('buster-chartjs-tooltip');

  if (!tooltipEl) {
    //@ts-ignore
    const isPieChart = chart.config.type === 'pie';
    tooltipEl = document.createElement('div');
    tooltipEl.id = 'buster-chartjs-tooltip';
    tooltipEl.className =
      'pointer-events-none fixed left-0 shadow-lg top-0 bg-white dark:bg-black rounded transition-all';
    tooltipEl.style.zIndex = '999';

    tooltipEl.innerHTML = `
      <div class="tooltip-caret" ></div>
      <div class="tooltip-content bg-white" style="position: relative; z-index: 2; border: 0.5px solid ${token.colorBorder}; border-radius: 4px"></div>
    `;

    const caretEl = tooltipEl.querySelector('.tooltip-caret')! as HTMLDivElement;
    caretEl.style.position = 'absolute';
    caretEl.style.width = '8px';
    caretEl.style.height = '8px';
    caretEl.style.transform = 'rotate(45deg)';
    caretEl.style.backgroundColor = 'inherit';
    caretEl.style.border = `0.5px solid ${token.colorBorder}`;
    caretEl.style.borderRadius = '1px';
    caretEl.style.zIndex = '1';
    caretEl.style.display = isPieChart ? 'none' : '';

    document.body.appendChild(tooltipEl);
  }

  return tooltipEl;
};

const externalTooltip = (
  context: TooltipContext,
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>,
  selectedChartType: NonNullable<BusterChartProps['selectedChartType']>,
  matchedCacheItem: string | undefined,
  keyToUsePercentage: string[],
  columnSettings: NonNullable<BusterChartProps['columnSettings']>,
  hasCategoryAxis: boolean,
  hasMultipleMeasures: boolean
) => {
  const { chart, tooltip } = context;
  const tooltipEl = getOrCreateInitialTooltipContainer(chart)!;

  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = '0';
    return matchedCacheItem;
  }

  if (matchedCacheItem) {
    tooltipEl.querySelector('.tooltip-content')!.innerHTML = matchedCacheItem;
    const isHidden = matchedCacheItem.includes('!hidden');
    tooltipEl.style.display = isHidden ? 'none' : 'block';
  } else if (tooltip.body) {
    const dataPoints = tooltip.dataPoints;

    tooltipEl.querySelector('.tooltip-content')!.innerHTML = renderToString(
      <BusterChartJSTooltip
        dataPoints={dataPoints}
        columnLabelFormats={columnLabelFormats}
        selectedChartType={selectedChartType}
        keyToUsePercentage={keyToUsePercentage}
        columnSettings={columnSettings}
        chart={chart}
        hasCategoryAxis={hasCategoryAxis}
        hasMultipleMeasures={hasMultipleMeasures}
      />
    );
  }

  const chartRect = chart.canvas.getBoundingClientRect();
  const tooltipOffset = 14;
  const overflowAllowance = 50;

  let left = chartRect.left + tooltip.caretX + tooltipOffset;
  let top = chartRect.top + tooltip.caretY - tooltipEl.offsetHeight / 2;
  let caretLeft = '-0px';
  let caretTop = '50%';
  let caretBorder = 'border-left-0 border-top-0';

  const chartRight = chartRect.right;
  const chartBottom = chartRect.bottom;

  if (left + tooltipEl.offsetWidth > chartRight + overflowAllowance) {
    left = chartRect.left + tooltip.caretX - tooltipOffset - tooltipEl.offsetWidth;
    caretLeft = '100%';
    caretBorder = 'border-right-0 border-top-0';
  }

  if (top < chartRect.top - overflowAllowance) {
    top = chartRect.top - overflowAllowance;
  } else if (top + tooltipEl.offsetHeight > chartBottom + overflowAllowance) {
    top = chartBottom + overflowAllowance - tooltipEl.offsetHeight;
  }

  tooltipEl.style.opacity = '1';
  tooltipEl.style.left = `${left}px`;
  tooltipEl.style.top = `${top}px`;

  const caretEl = tooltipEl.querySelector('.tooltip-caret')! as HTMLDivElement;
  caretEl.style.left = caretLeft;
  caretEl.style.top = caretTop;
  caretEl.style.marginLeft = caretLeft === '100%' ? '-4px' : '-4px';
  caretEl.style.marginTop = '-4px';
  caretEl.className = `tooltip-caret ${caretBorder}`;

  return tooltipEl.querySelector('.tooltip-content')!.innerHTML;
};
