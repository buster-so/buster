import {
  type ColumnSettings,
  DEFAULT_COLUMN_LABEL_FORMAT,
  DEFAULT_COLUMN_SETTINGS,
} from '@buster/server-shared/metrics';
import { Chart as ChartJS, Filler, type Scale, type ScriptableContext } from 'chart.js';
import { JOIN_CHARACTER } from '@/lib/axisFormatter';
import { addOpacityToColor } from '@/lib/colors';
import { formatLabel } from '@/lib/columnFormatter';
import { createDayjsDate } from '@/lib/date';
import type { DatasetOption } from '../../../chartHooks';
import { formatLabelForDataset } from '../../../commonHelpers';
import type { ChartProps } from '../../core';
import { formatBarAndLineDataLabel } from '../../helpers';
import { defaultLabelOptionConfig } from '../useChartSpecificOptions/labelOptionConfig';
import { barSeriesBuilder_labels } from './barSeriesBuilder';
import { createTickDates } from './createTickDate';
import { createTrendlineOnSeries } from './createTrendlines';
import type { SeriesBuilderProps } from './interfaces';
import type { LabelBuilderProps } from './useSeriesOptions';

ChartJS.register(Filler); // Removed to reduce bundle size

const HOVER_RADIUS_MULTIPLIER = 1;

export const lineSeriesBuilder = ({
  colors,
  columnSettings,
  columnLabelFormats,
  lineGroupType,
  datasetOptions,
  xAxisKeys,
  trendlines,
}: SeriesBuilderProps): ChartProps<'line'>['data']['datasets'][number][] => {
  return datasetOptions.datasets.map<ChartProps<'line'>['data']['datasets'][number]>(
    (dataset, index) => {
      return lineBuilder({
        lineGroupType,
        dataset,
        colors,
        columnSettings,
        columnLabelFormats,
        index,
        xAxisKeys,
        trendlines,
      });
    }
  );
};

export const lineBuilder = (
  props: Pick<
    SeriesBuilderProps,
    | 'colors'
    | 'columnSettings'
    | 'columnLabelFormats'
    | 'lineGroupType'
    | 'xAxisKeys'
    | 'trendlines'
  > & {
    index: number;
    yAxisID?: string;
    order?: number;
    dataset: DatasetOption;
  }
): ChartProps<'line'>['data']['datasets'][number] => {
  const {
    lineGroupType,
    colors,
    columnSettings,
    columnLabelFormats,
    index,
    yAxisID,
    order,
    dataset,
    xAxisKeys,
    trendlines,
  } = props;
  const { dataKey } = dataset;
  const yKey = dataKey;
  const columnSetting = columnSettings[dataKey] || DEFAULT_COLUMN_SETTINGS;
  const columnLabelFormat = columnLabelFormats[yKey] || DEFAULT_COLUMN_LABEL_FORMAT;
  const {
    showDataLabels,
    lineSymbolSize = DEFAULT_COLUMN_SETTINGS.lineSymbolSize,
    lineStyle,
    lineWidth,
    lineType,
  } = columnSetting;

  const colorLength = colors.length;
  const color = colors[index % colorLength] || '';

  // Pre-calculate point dimensions
  const hoverRadius = lineSymbolSize * HOVER_RADIUS_MULTIPLIER;
  const isStackedArea = lineGroupType === 'percentage-stack';
  const isArea = lineStyle === 'area' || isStackedArea;
  const fill = isArea ? (index === 0 ? 'origin' : '-1') : false;
  const percentageMode = isStackedArea
    ? 'stacked'
    : columnSetting.showDataLabelsAsPercentage
      ? 'data-label'
      : false;

  return {
    type: 'line',
    yAxisID: yAxisID || 'y',
    label: formatLabelForDataset(dataset, columnLabelFormats),
    fill,
    tooltipData: dataset.tooltipData,
    xAxisKeys,
    tension: getLineTension(lineType),
    stepped: lineType === 'step',
    spanGaps: true,
    yAxisKey: yKey,
    borderWidth: lineWidth,
    order: order || 0,
    //line will only have one dataset
    data: dataset.data,
    backgroundColor: createFillColor(color, isArea, isStackedArea),
    borderColor: color,
    pointBackgroundColor: addOpacityToColor(color, 0.85),
    pointBorderColor: addOpacityToColor(color, 1),
    pointRadius: lineSymbolSize,
    pointHoverRadius: hoverRadius,
    pointBorderWidth: 1.2,
    pointHoverBorderWidth: 1.65,
    trendline: createTrendlineOnSeries({
      trendlines,
      datasetColor: color,
      yAxisKey: dataset.dataKey,
      columnLabelFormats,
    }),
    datalabels: {
      clamp: true,
      display: showDataLabels
        ? (context) => {
            const xScale = context.chart.scales.x as Scale;
            const isXScaleTime = xScale.type === 'time';

            if (isXScaleTime && context.dataIndex === context.dataset.data.length - 1) {
              return false;
            }

            return 'auto';
          }
        : false,
      formatter: (value, context) =>
        formatBarAndLineDataLabel(value, context, percentageMode, columnLabelFormat),
      ...getLabelPosition(isStackedArea),
      ...defaultLabelOptionConfig,
      ...(percentageMode === 'data-label' && {
        color: 'white',
      }),
    } satisfies ChartProps<'line'>['data']['datasets'][number]['datalabels'],
  } satisfies ChartProps<'line'>['data']['datasets'][number];
};

const getLabelPosition = (
  isStackedArea: boolean
): ChartProps<'line'>['data']['datasets'][number]['datalabels'] => {
  if (isStackedArea) {
    return {
      anchor: 'start',
      align: 'bottom',
      //  offset: -10
    };
  }
  return {
    anchor: 'end',
    align: 'top',
    //  offset:0
  };
};

const getLineTension = (lineType: ColumnSettings['lineType']) => {
  switch (lineType) {
    case 'smooth':
      return 0.375;
    default:
      return 0;
  }
};

const createFillColor = (color: string, isArea: boolean, isStackedArea: boolean) => {
  if (!isArea) {
    return color;
  }

  return (context: ScriptableContext<'line'>) => {
    const ctx = context.chart.ctx;
    const datasets = context.chart.data.datasets;
    const hasMultipleShownDatasets = datasets.filter((dataset) => !dataset.hidden).length > 1;
    const gradient = ctx.createLinearGradient(0, 0, 0, context.chart.height);

    if (isStackedArea) {
      gradient.addColorStop(0, addOpacityToColor(color, 0.75));
      gradient.addColorStop(0.7, addOpacityToColor(color, 0.385));
    } else if (hasMultipleShownDatasets) {
      gradient.addColorStop(0, addOpacityToColor(color, 0.75));
      gradient.addColorStop(0.25, addOpacityToColor(color, 0.45));
      gradient.addColorStop(0.875, addOpacityToColor(color, 0.035));
    } else {
      gradient.addColorStop(0, addOpacityToColor(color, 0.95)); //0.55
      gradient.addColorStop(0.65, addOpacityToColor(color, 0.075));
    }

    gradient.addColorStop(1, addOpacityToColor(color, 0));
    return gradient;
  };
};

export const lineSeriesBuilder_labels = ({
  datasetOptions,
  xAxisKeys,
  columnLabelFormats,
}: LabelBuilderProps): (string | Date)[] => {
  const dateTicks = createTickDates(datasetOptions.ticks, xAxisKeys, columnLabelFormats);
  if (dateTicks) {
    return dateTicks;
  }

  return barSeriesBuilder_labels({
    datasetOptions,
    columnLabelFormats,
  });
};
