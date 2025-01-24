import { extractFieldsFromChain } from '@/components/charts/chartHooks';
import { Chart, Filler, ScriptableContext } from 'chart.js';
import type { ChartProps } from '../../core';
import { SeriesBuilderProps } from './interfaces';
import { LabelBuilderProps } from './useSeriesOptions';
import { formatChartLabelDelimiter } from '../../../commonHelpers';
import { addOpacityToColor, createDayjsDate } from '@/utils';
import { defaultLabelOptionConfig } from '../useChartSpecificOptions/labelOptionConfig';
import { DEFAULT_COLUMN_SETTINGS } from '@/api/buster_rest';
import type { ColumnSettings } from '@/components/charts/interfaces';
import { formatBarAndLineDataLabel } from '../../helpers';

Chart.register(Filler);

const HOVER_RADIUS_MULTIPLIER = 1;

export const lineSeriesBuilder = ({
  selectedDataset,
  allYAxisKeysIndexes,
  colors,
  columnSettings,
  columnLabelFormats,
  xAxisKeys,
  lineGroupType
}: SeriesBuilderProps): ChartProps<'line'>['data']['datasets'][number][] => {
  return allYAxisKeysIndexes.map<ChartProps<'line'>['data']['datasets'][number]>(
    (yAxisItem, index) => {
      return lineBuilder({
        lineGroupType,
        selectedDataset,
        colors,
        columnSettings,
        columnLabelFormats,
        yAxisItem,
        index,
        xAxisKeys
      });
    }
  );
};

export const lineBuilder = (
  props: Pick<
    SeriesBuilderProps,
    | 'selectedDataset'
    | 'colors'
    | 'columnSettings'
    | 'columnLabelFormats'
    | 'lineGroupType'
    | 'xAxisKeys'
  > & {
    yAxisItem: SeriesBuilderProps['allYAxisKeysIndexes'][number];
    index: number;
    yAxisID?: string;
    order?: number;
  }
): ChartProps<'line'>['data']['datasets'][number] => {
  const {
    lineGroupType,
    selectedDataset,
    colors,
    columnSettings,
    columnLabelFormats,
    yAxisItem,
    index,
    xAxisKeys,
    yAxisID,
    order
  } = props;
  const yKey = extractFieldsFromChain(yAxisItem.name).at(-1)!?.key;
  const columnSetting = columnSettings[yKey];
  const columnLabelFormat = columnLabelFormats[yKey];
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
  const usePercentage = isStackedArea;

  return {
    type: 'line',
    yAxisID: yAxisID || 'y',
    xAxisKeys,
    label: yAxisItem.name,
    fill,
    tension: getLineTension(lineType),
    stepped: lineType === 'step',
    spanGaps: true,
    borderWidth: lineWidth,
    order: order || 0,
    //line will only have one dataset
    data: selectedDataset.source.map((item) => item[yAxisItem.index] as number),
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
        formatBarAndLineDataLabel(value, context, usePercentage, columnLabelFormat),
      ...getLabelPosition(isStackedArea),
      ...defaultLabelOptionConfig
    }
  } as ChartProps<'line'>['data']['datasets'][number];
};

const getLabelPosition = (isStackedArea: boolean) => {
  if (isStackedArea) {
    return {
      anchor: 'start',
      align: 'bottom',
      yAdjust: -10
    };
  }
  return {
    anchor: 'end',
    align: 'top',
    yAdjust: 17
  };
};

const getLineTension = (lineType: ColumnSettings['lineType']) => {
  switch (lineType) {
    case 'smooth':
      return 0.125;
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
  dataset,
  xAxisKeys,
  columnLabelFormats
}: LabelBuilderProps): (string | Date)[] => {
  const xColumnLabelFormat = columnLabelFormats[xAxisKeys[0]];
  const useDateLabels =
    xAxisKeys.length === 1 &&
    xColumnLabelFormat.columnType === 'date' &&
    xColumnLabelFormat.style === 'date';

  return dataset.source.map<string | Date>((item) => {
    if (useDateLabels) {
      const date = createDayjsDate(item[0] as string).toDate();
      return date;
    }

    return formatChartLabelDelimiter(item[0] as string, columnLabelFormats);
  });
};
