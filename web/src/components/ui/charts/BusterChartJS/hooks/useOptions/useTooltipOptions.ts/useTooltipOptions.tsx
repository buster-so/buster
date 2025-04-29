'use client';

import type {
  BusterChartProps,
  ChartEncodes,
  ComboChartAxis
} from '@/api/asset_interfaces/metric/charts';
import { DeepPartial } from 'utility-types';
import type { TooltipOptions } from 'chart.js';
import { useEffect, useMemo, useRef } from 'react';
import { useMemoizedFn, useUnmount } from '@/hooks';
import type { ChartJSOrUndefined } from '../../../core/types';
import { renderToString } from 'react-dom/server';
import { BusterChartJSTooltip } from './BusterChartJSTooltip';
import React from 'react';
import { isNumericColumnType } from '@/lib/messages';
import { DEFAULT_COLUMN_LABEL_FORMAT } from '@/api/asset_interfaces/metric';

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
  hasMismatchedTooltipsAndMeasures: boolean;
  disableTooltip: boolean;
  colors: string[];
}

const MAX_TOOLTIP_CACHE_SIZE = 25;

export const useTooltipOptions = ({
  columnLabelFormats,
  selectedChartType,
  tooltipKeys,
  barGroupType,
  lineGroupType,
  pieDisplayLabelAs,
  columnSettings,
  selectedAxis,
  disableTooltip,
  colors
}: UseTooltipOptionsProps): DeepPartial<TooltipOptions> => {
  const tooltipCache = useRef<Record<string, string>>({});

  const columnLabelFormatsString = useMemo(
    () => JSON.stringify(columnLabelFormats),
    [columnLabelFormats]
  );

  const colorsStringCache = useMemo(() => {
    return colors.map((c) => String(c)).join('');
  }, [colors]);

  const mode: TooltipOptions['mode'] = useMemo(() => {
    if (selectedChartType === 'scatter') {
      return 'nearest';
    }

    if (selectedChartType === 'pie') {
      return 'nearest';
    }

    return 'index';
  }, [selectedChartType]);

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
    console.log(useGlobalPercentage, selectedChartType, tooltipKeys);
    if (useGlobalPercentage)
      return tooltipKeys.filter((key) => {
        const selectedColumnLabelFormat = columnLabelFormats[key] || DEFAULT_COLUMN_LABEL_FORMAT;
        console.log(key, selectedColumnLabelFormat);
        return isNumericColumnType(selectedColumnLabelFormat.columnType);
      });

    if (selectedChartType === 'bar') {
      return tooltipKeys.filter((key) => {
        const selectedColumnLabelFormat = columnLabelFormats[key] || DEFAULT_COLUMN_LABEL_FORMAT;
        return (
          columnSettings[key]?.showDataLabelsAsPercentage &&
          isNumericColumnType(selectedColumnLabelFormat.columnType)
        );
      });
    }

    return [];
  }, [useGlobalPercentage, selectedChartType, columnSettings, tooltipKeys]);

  const memoizedExternal = useMemoizedFn((context: TooltipContext) => {
    const key = createTooltipCacheKey(
      context.chart,
      keyToUsePercentage,
      columnLabelFormatsString,
      colorsStringCache
    );
    const matchedCacheItem = tooltipCache.current[key];
    const result = externalTooltip(
      context,
      columnLabelFormats,
      selectedChartType,
      matchedCacheItem,
      keyToUsePercentage,
      hasCategoryAxis,
      hasMultipleMeasures,
      barGroupType,
      lineGroupType
    );

    if (result) {
      if (Object.keys(tooltipCache.current).length > MAX_TOOLTIP_CACHE_SIZE) {
        tooltipCache.current = {};
      }
      tooltipCache.current[key] = result;
    }
  });

  const tooltipOptions: DeepPartial<TooltipOptions> = useMemo(
    () => ({
      enabled: false,
      mode,
      external: disableTooltip ? () => {} : memoizedExternal
    }),
    [mode, disableTooltip, memoizedExternal, selectedChartType]
  );

  useEffect(() => {
    tooltipCache.current = {};
  }, [selectedAxis, selectedChartType, disableTooltip]);

  useUnmount(() => {
    const tooltipEl = document.getElementById('buster-chartjs-tooltip');
    if (tooltipEl) tooltipEl.remove();
  });

  return tooltipOptions;
};

const createTooltipCacheKey = (
  chart: ChartJSOrUndefined,
  keyToUsePercentage: string[],
  columnLabelFormatsString: string,
  colorsStringCache: string
) => {
  if (!chart?.tooltip) return '';

  const parts = [
    //@ts-ignore
    chart.config.type,
    chart.tooltip.title?.join(''),
    chart.tooltip.body?.map((b) => b.lines.join('')).join(''),
    keyToUsePercentage?.join(''),
    columnLabelFormatsString,
    colorsStringCache
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
      'pointer-events-none fixed left-0 shadow-lg top-0 bg-white dark:bg-black rounded-sm transition-all';
    tooltipEl.style.zIndex = '999';

    tooltipEl.innerHTML = `
      <div class="tooltip-caret" ></div>
      <div class="tooltip-content bg-background" style="position: relative; z-index: 2; border: 0.5px solid var(--color-border); border-radius: 4px"></div>
    `;

    const caretEl = tooltipEl.querySelector('.tooltip-caret')! as HTMLDivElement;
    caretEl.style.position = 'absolute';
    caretEl.style.width = '8px';
    caretEl.style.height = '8px';
    caretEl.style.transform = 'rotate(45deg)';
    caretEl.style.backgroundColor = 'inherit';
    caretEl.style.border = `0.5px solid var(--color-border)`;
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
  hasCategoryAxis: boolean,
  hasMultipleMeasures: boolean,
  barGroupType: BusterChartProps['barGroupType'],
  lineGroupType: BusterChartProps['lineGroupType']
) => {
  const { chart, tooltip } = context;
  const tooltipEl = getOrCreateInitialTooltipContainer(chart)!;

  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = '0';
    return matchedCacheItem;
  }

  if (matchedCacheItem) {
    tooltipEl.querySelector('.tooltip-content')!.innerHTML = matchedCacheItem;
    const isHidden = matchedCacheItem.includes('hidden!');
    tooltipEl.style.display = isHidden ? 'none' : 'block';
  } else if (tooltip.body) {
    const dataPoints = tooltip.dataPoints;

    tooltipEl.querySelector('.tooltip-content')!.innerHTML = renderToString(
      <BusterChartJSTooltip
        dataPoints={dataPoints}
        columnLabelFormats={columnLabelFormats}
        selectedChartType={selectedChartType}
        keyToUsePercentage={keyToUsePercentage}
        chart={chart}
        hasCategoryAxis={hasCategoryAxis}
        hasMultipleMeasures={hasMultipleMeasures}
        barGroupType={barGroupType}
        lineGroupType={lineGroupType}
      />
    );
  }

  const chartRect = chart.canvas.getBoundingClientRect();
  const tooltipOffset = 14;
  const overflowAllowance = 50;

  let left = chartRect.left + tooltip.caretX + tooltipOffset;
  let top = chartRect.top + tooltip.caretY - tooltipEl.offsetHeight / 2;
  let caretLeft = '-0px';
  const caretTop = '50%';
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
