import { DatasetOption, extractFieldsFromChain } from '../../../chartHooks';
import { Chart, Filler, ScriptableContext } from 'chart.js';
import type { ChartProps } from '../../core';
import { SeriesBuilderProps } from './interfaces';
import { LabelBuilderProps } from './useSeriesOptions';
import { formatChartLabelDelimiter, formatLabelForDataset } from '../../../commonHelpers';
import { addOpacityToColor, createDayjsDate, formatLabel } from '@/lib';
import { defaultLabelOptionConfig } from '../useChartSpecificOptions/labelOptionConfig';
import {
  DEFAULT_COLUMN_LABEL_FORMAT,
  DEFAULT_COLUMN_SETTINGS
} from '@/api/asset_interfaces/metric/defaults';
import type { ColumnSettings } from '@/api/asset_interfaces/metric/charts';
import { formatBarAndLineDataLabel } from '../../helpers';

Chart.register(Filler);

const HOVER_RADIUS_MULTIPLIER = 1;

export const lineSeriesBuilder = ({
  colors,
  columnSettings,
  columnLabelFormats,
  xAxisKeys,
  lineGroupType,
  datasetOptions
}: SeriesBuilderProps): ChartProps<'line'>['data']['datasets'][number][] => {
  return [];
  // return allYAxisKeysIndexes.map<ChartProps<'line'>['data']['datasets'][number]>(
  //   (yAxisItem, index) => {
  //     return lineBuilder({
  //       lineGroupType,
  //       selectedDataset,
  //       colors,
  //       columnSettings,
  //       columnLabelFormats,
  //       yAxisItem,
  //       index,
  //       xAxisKeys
  //     });
  //   }
  // );
};

export const lineBuilder = (
  props: Pick<
    SeriesBuilderProps,
    | 'colors'
    | 'columnSettings'
    | 'columnLabelFormats'
    | 'xAxisKeys'
    | 'lineGroupType'
    | 'barGroupType'
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
    xAxisKeys,
    yAxisID,
    order,
    dataset
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
    lineType
  } = columnSetting;

  const colorLength = colors.length;
  const color = colors[index % colorLength];

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
    xAxisKeys,
    label: formatLabelForDataset(dataset, columnLabelFormats),
    fill,
    tension: getLineTension(lineType),
    stepped: lineType === 'step',
    spanGaps: true,
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
    datalabels: {
      clamp: true,
      display: showDataLabels
        ? (context) => {
            const xScale = context.chart.scales.x;
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
        color: 'white'
      })
    } satisfies ChartProps<'line'>['data']['datasets'][number]['datalabels']
  } as ChartProps<'line'>['data']['datasets'][number];
};

const getLabelPosition = (
  isStackedArea: boolean
): ChartProps<'line'>['data']['datasets'][number]['datalabels'] => {
  if (isStackedArea) {
    return {
      anchor: 'start',
      align: 'bottom'
      //  offset: -10
    };
  }
  return {
    anchor: 'end',
    align: 'top'
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
  columnLabelFormats
}: LabelBuilderProps): (string | Date)[] => {
  const xColumnLabelFormat = columnLabelFormats[xAxisKeys[0]] || DEFAULT_COLUMN_LABEL_FORMAT;
  const useDateLabels =
    xAxisKeys.length === 1 &&
    xColumnLabelFormat.columnType === 'date' &&
    xColumnLabelFormat.style === 'date';
  const ticksKey = datasetOptions.ticksKey;

  if (useDateLabels) {
    return datasetOptions.ticks.flatMap((item) => {
      return item.map<Date>((item, index) => {
        return createDayjsDate(item as string).toDate();
      });
    });
  }

  return datasetOptions.ticks.flatMap((item) => {
    return item.map<string>((item, index) => {
      const key = ticksKey[index]?.key;
      const columnLabelFormat = columnLabelFormats[key];
      return formatLabel(item, columnLabelFormat);
    });
  });
};
