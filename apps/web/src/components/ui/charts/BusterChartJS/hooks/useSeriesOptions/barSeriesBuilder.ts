import { type ColumnLabelFormat, DEFAULT_COLUMN_LABEL_FORMAT } from '@buster/server-shared/metrics';
import type { BarElement } from 'chart.js';
import type { Context } from 'chartjs-plugin-datalabels';
import type { Options } from 'chartjs-plugin-datalabels/types/options';
import { JOIN_CHARACTER, JOIN_CHARACTER_DATE } from '@/lib/axisFormatter';
import { formatLabel } from '@/lib/columnFormatter';
import type { BusterChartProps } from '../../../BusterChart.types';
import type { DatasetOption } from '../../../chartHooks';
import { formatLabelForDataset, formatYAxisLabel, yAxisSimilar } from '../../../commonHelpers';
import { DEFAULT_CHART_LAYOUT } from '../../ChartJSTheme';
import type { ChartProps } from '../../core';
import { dataLabelFontColorContrast, formatBarAndLineDataLabel } from '../../helpers';
import { defaultLabelOptionConfig } from '../useChartSpecificOptions/labelOptionConfig';
import { createTickDates } from './createTickDate';
import { createTrendlineOnSeries } from './createTrendlines';
import type { SeriesBuilderProps } from './interfaces';
import type { LabelBuilderProps } from './useSeriesOptions';

export const barSeriesBuilder = ({
  datasetOptions,
  colors,
  columnSettings,
  columnLabelFormats,
  barShowTotalAtTop,
  barGroupType,
  yAxisKeys,
  y2AxisKeys,
  xAxisKeys,
  trendlines,
}: SeriesBuilderProps): ChartProps<'bar'>['data']['datasets'] => {
  const dataLabelOptions: Options['labels'] = {};

  if (barShowTotalAtTop && (yAxisKeys.length > 1 || y2AxisKeys?.length > 0)) {
    let hasBeenDrawn = false;

    dataLabelOptions.stackTotal = {
      display: (context) => {
        const chart = context.chart;
        const shownDatasets = context.chart.data.datasets.filter(
          (dataset, index) =>
            !dataset.hidden &&
            //this means that it is hidden via the legend
            !chart.getDatasetMeta(index).hidden
        );
        const canDisplay = context.datasetIndex === shownDatasets.length - 1;
        if (canDisplay && !hasBeenDrawn) {
          const chartLayout = context.chart.options.layout;
          const padding = { ...DEFAULT_CHART_LAYOUT.padding, top: 24 };
          context.chart.options.layout = { ...chartLayout, padding };
          requestAnimationFrame(() => {
            context.chart.update(); //this is hack because the chart data label almost always overflows
          });
          hasBeenDrawn = true;
        }
        return canDisplay ? 'auto' : false;
      },
      formatter: (_, context) => {
        const canUseSameYFormatter = yAxisSimilar(yAxisKeys, columnLabelFormats);
        const value = context.chart.$totalizer.stackTotals[context.dataIndex] || 0;
        return formatYAxisLabel(
          value,
          yAxisKeys,
          canUseSameYFormatter,
          columnLabelFormats,
          false,
          false
        );
      },
      anchor: 'end',
      align: 'end',
      clamp: true,
      clip: false,
      z: 999,
      ...defaultLabelOptionConfig,
    } as NonNullable<Options['labels']>['stackTotal'];
  }

  return datasetOptions.datasets.map<ChartProps<'bar'>['data']['datasets'][number]>(
    (dataset, index) => {
      return barBuilder({
        dataset,
        colors,
        columnSettings,
        columnLabelFormats,
        index,
        dataLabelOptions,
        barGroupType,
        xAxisKeys,
        trendlines,
      });
    }
  );
};

declare module 'chart.js' {
  interface Chart {
    $barDataLabelsPercentageMode: false | 'stacked' | 'data-label';
    $barDataLabels: Record<number, Record<number, string>>;
    $barDataLabelsGlobalRotation: boolean;
    $barDataLabelsUpdateInProgress: boolean;
    $barDataLabelsLastRotationCheck?: number;
  }
}

const TEXT_WIDTH_BUFFER = 4;
const MAX_BAR_HEIGHT = 16;
const MAX_BAR_WIDTH = 13;
const FULL_ROTATION_ANGLE = -90;
const ROTATION_CHECK_THROTTLE = 225; // ms

export const barBuilder = ({
  dataset,
  colors,
  columnSettings,
  columnLabelFormats,
  index,
  yAxisID,
  order,
  dataLabelOptions,
  barGroupType,
  xAxisKeys,
  trendlines,
}: Pick<SeriesBuilderProps, 'colors' | 'columnSettings' | 'columnLabelFormats' | 'xAxisKeys'> & {
  dataset: DatasetOption;
  index: number;
  yAxisID?: string;
  order?: number;
  dataLabelOptions?: Options['labels'];
  barGroupType: BusterChartProps['barGroupType'];
  trendlines: BusterChartProps['trendlines'];
}): ChartProps<'bar'>['data']['datasets'][number] => {
  const yKey = dataset.dataKey;
  const columnSetting = columnSettings[yKey];
  const columnLabelFormat = columnLabelFormats[yKey];
  const showLabels = !!columnSetting?.showDataLabels;
  const isPercentageStackedBar =
    barGroupType === 'percentage-stack' ||
    (barGroupType === 'stack' && columnSetting?.showDataLabelsAsPercentage);
  const color = colors[index % colors.length];
  const datasetColor = dataset.colors;

  const percentageMode = isPercentageStackedBar
    ? 'stacked'
    : columnSetting?.showDataLabelsAsPercentage
      ? 'data-label'
      : false;

  return {
    type: 'bar',
    label: formatLabelForDataset(dataset, columnLabelFormats),
    yAxisID: yAxisID || 'y',
    order,
    yAxisKey: yKey,
    data: dataset.data,
    backgroundColor: datasetColor || color,
    borderRadius: (columnSetting?.barRoundness || 0) / 2,
    tooltipData: dataset.tooltipData,
    xAxisKeys,
    trendline: createTrendlineOnSeries({
      trendlines,
      datasetColor: color,
      yAxisKey: dataset.dataKey,
      columnLabelFormats,
    }),
    datalabels: showLabels
      ? ({
          clamp: false,
          clip: false,
          labels: {
            barTotal: {
              color: dataLabelFontColorContrast,
              borderWidth: 0,
              padding: 1,
              borderRadius: 2.5,
              anchor: 'end',
              align: 'start',
              display: (context) => {
                // if (!context.chart.$initialAnimationCompleted) {
                //   return false;
                // }
                // Initialize the global rotation flag if it doesn't exist
                if (context.chart.$barDataLabelsGlobalRotation === undefined) {
                  context.chart.$barDataLabelsGlobalRotation = false;
                  context.chart.$barDataLabelsUpdateInProgress = false;
                  context.chart.$barDataLabelsLastRotationCheck = 0;
                  //we call this here to ensure that the barDataLabels are set
                  getFormattedValueAndSetBarDataLabels(context, {
                    percentageMode,
                    columnLabelFormat: columnLabelFormat || DEFAULT_COLUMN_LABEL_FORMAT,
                  });
                }

                // First dataset - analyze all data points to determine if any need rotation
                if (index === 0 && context.datasetIndex === 0) {
                  throttledSetGlobalRotation(context);
                }

                const rawValue = context.dataset.data[context.dataIndex] as number;

                if (!showLabels || !rawValue) return false;

                const { barWidth, barHeight } = getBarDimensions(context);

                if (barWidth < MAX_BAR_WIDTH) return false;

                const formattedValue = getFormattedValueAndSetBarDataLabels(context, {
                  percentageMode,
                  columnLabelFormat: columnLabelFormat || DEFAULT_COLUMN_LABEL_FORMAT,
                });

                // Get text width for this specific label
                const { width: textWidth } = context.chart.ctx.measureText(formattedValue);

                // Use the global rotation setting
                const rotation = context.chart.$barDataLabelsGlobalRotation
                  ? FULL_ROTATION_ANGLE
                  : 0;

                // Check if this label can be displayed even with rotation
                if (rotation === -90 && textWidth > barHeight - TEXT_WIDTH_BUFFER) {
                  return false;
                }

                // Check if the bar height is too small to display the label
                if (barHeight < MAX_BAR_HEIGHT) return false;

                return 'auto';
              },
              formatter: (_, context) => {
                return (
                  context.chart.$barDataLabels?.[context.datasetIndex]?.[context.dataIndex] || ''
                );
              },
              rotation: (context) => {
                // Always use the global rotation setting
                return context.chart.$barDataLabelsGlobalRotation ? FULL_ROTATION_ANGLE : 0;
              },
              backgroundColor: ({ datasetIndex, chart }) => {
                const backgroundColor = chart.options.backgroundColor as string[];
                return backgroundColor[datasetIndex] ?? null;
              },
            },
            ...dataLabelOptions,
          },
        } satisfies ChartProps<'bar'>['data']['datasets'][number]['datalabels'])
      : undefined,
  } satisfies ChartProps<'bar'>['data']['datasets'][number];
};

const setBarDataLabelsManager = (
  context: Context,
  formattedValue: string,
  percentageMode: false | 'stacked' | 'data-label'
) => {
  const dataIndex = context.dataIndex;
  const datasetIndex = context.datasetIndex;

  context.chart.$barDataLabels = {
    ...context.chart.$barDataLabels,
    [datasetIndex]: {
      ...context.chart.$barDataLabels?.[datasetIndex],
      [dataIndex]: formattedValue,
    },
  };
  context.chart.$barDataLabelsPercentageMode = percentageMode;
};

const getBarDimensions = (context: Context) => {
  const barElement = context.chart.getDatasetMeta(context.datasetIndex).data[
    context.dataIndex
  ] as BarElement;

  const { width: barWidth, height: barHeight } = barElement?.getProps?.(
    ['width', 'height'],
    true
  ) || {
    width: 0,
    height: 0,
  };
  return { barWidth, barHeight };
};

const throttledSetGlobalRotation = (context: Context) => {
  const now = Date.now();
  // Skip if we checked recently or if update is in progress
  if (
    context.chart.$barDataLabelsUpdateInProgress ||
    (context.chart.$barDataLabelsLastRotationCheck &&
      now - context.chart.$barDataLabelsLastRotationCheck < ROTATION_CHECK_THROTTLE)
  ) {
    return;
  }

  // Mark that we're checking now
  context.chart.$barDataLabelsLastRotationCheck = now;
  context.chart.$barDataLabelsUpdateInProgress = true;
  setGlobalRotation(context);

  // Use requestAnimationFrame to ensure we're not blocking the main thread
  requestAnimationFrame(() => {
    // Mark that we're done updating
    context.chart.$barDataLabelsUpdateInProgress = false;
  });
};

const setGlobalRotation = (context: Context) => {
  context.chart.$barDataLabelsGlobalRotation = false;

  const labels = context.chart.data.datasets
    .filter((d) => !d.hidden)
    .flatMap((dataset, datasetIndex) => {
      return dataset.data.map((_value, dataIndex) => {
        const currentValue = context.chart.$barDataLabels?.[datasetIndex]?.[dataIndex] || '';
        return currentValue || '';
      });
    });

  const labelNeedsToBeRotated = labels.some((label) => {
    if (!label && !!context.chart.ctx?.measureText) return false;
    const { width: textWidth } = context.chart.ctx?.measureText?.(label) || { width: 0 };
    const { barWidth } = getBarDimensions(context);
    return textWidth > barWidth - TEXT_WIDTH_BUFFER;
  });

  if (labelNeedsToBeRotated) {
    context.chart.$barDataLabelsGlobalRotation = true;
  }
};

const getFormattedValueAndSetBarDataLabels = (
  context: Context,
  {
    percentageMode,
    columnLabelFormat,
  }: {
    percentageMode: false | 'stacked' | 'data-label';
    columnLabelFormat: ColumnLabelFormat;
  }
) => {
  const rawValue = context.dataset.data[context.dataIndex] as number;
  const formattedValue = formatBarAndLineDataLabel(
    rawValue,
    context,
    percentageMode,
    columnLabelFormat
  );
  // Store only the formatted value, rotation is handled globally
  setBarDataLabelsManager(context, formattedValue, percentageMode);

  return formattedValue;
};

export const barSeriesBuilder_labels = ({
  datasetOptions,
  columnLabelFormats,
  xAxisKeys,
}: Pick<LabelBuilderProps, 'datasetOptions' | 'columnLabelFormats' | 'xAxisKeys'>) => {
  const dateTicks = createTickDates(datasetOptions.ticks, xAxisKeys, columnLabelFormats);
  if (dateTicks) {
    return dateTicks;
  }

  const containsADateStyle = datasetOptions.ticksKey.some((tick) => {
    const selectedColumnLabelFormat = columnLabelFormats[tick.key];
    return selectedColumnLabelFormat?.style === 'date';
  });
  const selectedJoinCharacter = containsADateStyle ? JOIN_CHARACTER_DATE : JOIN_CHARACTER;

  const labels = datasetOptions.ticks.flatMap((item) => {
    return item
      .map<string>((item, index) => {
        const key = datasetOptions.ticksKey[index]?.key || '';
        const columnLabelFormat = columnLabelFormats[key];
        return formatLabel(item, columnLabelFormat);
      })
      .join(selectedJoinCharacter);
  });

  return labels;
};
