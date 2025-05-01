import type { ChartProps } from '../../core';
import { LabelBuilderProps } from './useSeriesOptions';
import { SeriesBuilderProps } from './interfaces';
import { BubbleDataPoint, ScriptableContext } from 'chart.js';
import { DEFAULT_CHART_CONFIG, DEFAULT_COLUMN_LABEL_FORMAT } from '@/api/asset_interfaces/metric';
import { addOpacityToColor } from '@/lib/colors';
import { isDateColumnType } from '@/lib/messages';
import { createDayjsDate } from '@/lib/date';
import { lineSeriesBuilder_labels } from './lineSeriesBuilder';
import { formatLabelForDataset } from '../../../commonHelpers';

declare module 'chart.js' {
  interface BubbleDataPoint {
    originalR: number;
  }
}

const colorsRecord: Record<
  string,
  {
    color: string;
    backgroundColor: string;
    hoverBackgroundColor: string;
    borderColor: string;
  }
> = {};

export const scatterSeriesBuilder_data = ({
  colors,
  scatterDotSize,
  columnLabelFormats,
  xAxisKeys,
  sizeOptions,
  datasetOptions
}: SeriesBuilderProps): ChartProps<'bubble'>['data']['datasets'] => {
  const xAxisKey = xAxisKeys[0];
  const xAxisColumnLabelFormat = columnLabelFormats[xAxisKey] || DEFAULT_COLUMN_LABEL_FORMAT;
  const isXAxisDate = isDateColumnType(xAxisColumnLabelFormat.columnType);

  const hasSizeKeyIndex = sizeOptions !== null && !!sizeOptions.key;
  const scatterElementConfig = hasSizeKeyIndex
    ? {
        point: {
          radius: (context: ScriptableContext<'bubble'>) =>
            radiusMethod(context, sizeOptions, scatterDotSize)
        }
      }
    : undefined;

  return datasetOptions.datasets.map((dataset, datasetIndex) => {
    const color = colors[datasetIndex % colors.length];
    let backgroundColor = colorsRecord[color]?.backgroundColor;
    let hoverBackgroundColor = colorsRecord[color]?.hoverBackgroundColor;
    let borderColor = colorsRecord[color]?.borderColor;

    if (!colorsRecord[color]) {
      backgroundColor = addOpacityToColor(color, 0.6);
      hoverBackgroundColor = addOpacityToColor(color, 0.9);
      borderColor = color;
      colorsRecord[color] = { color, backgroundColor, hoverBackgroundColor, borderColor };
    }

    return {
      parsing: false, //we need to make sure the data is sorted
      label: formatLabelForDataset(dataset, columnLabelFormats),
      //@ts-ignore
      elements: scatterElementConfig,
      backgroundColor,
      hoverBackgroundColor,
      borderColor: color,
      tooltipData: dataset.tooltipData,
      yAxisKey: dataset.dataKey,
      xAxisKeys,
      data: dataset.data.reduce<BubbleDataPoint[]>((acc, yData, index) => {
        if (yData !== null) {
          acc.push({
            x: getScatterXValue({
              isXAxisDate,
              xValue: dataset.ticksForScatter![index][0]
            }),
            y: yData,
            originalR: dataset.sizeData?.[index] ?? 0
          });
        }
        return acc;
      }, [])
    } satisfies ChartProps<'bubble'>['data']['datasets'][number];
  });
};

const getScatterXValue = ({
  isXAxisDate,
  xValue
}: {
  isXAxisDate: boolean;
  xValue: number | string | Date | null;
}): number => {
  if (isXAxisDate && xValue) {
    return createDayjsDate(xValue as string).valueOf();
  }

  return xValue as number;
};

const radiusMethod = (
  context: ScriptableContext<'bubble'>,
  sizeOptions: SeriesBuilderProps['sizeOptions'],
  scatterDotSize: SeriesBuilderProps['scatterDotSize']
) => {
  //@ts-ignore
  const originalR = context.raw?.originalR;

  if (typeof originalR === 'number' && sizeOptions) {
    return computeSizeRatio(originalR, scatterDotSize, sizeOptions.minValue, sizeOptions.maxValue);
  }

  return scatterDotSize?.[0] ?? DEFAULT_CHART_CONFIG.scatterDotSize[0];
};

const computeSizeRatio = (
  size: number,
  scatterDotSize: SeriesBuilderProps['scatterDotSize'],
  minValue: number,
  maxValue: number
) => {
  const minRange = scatterDotSize?.[0] ?? DEFAULT_CHART_CONFIG.scatterDotSize[0];
  const maxRange = scatterDotSize?.[1] ?? DEFAULT_CHART_CONFIG.scatterDotSize[1];

  if (minValue === maxValue) {
    return (minRange + maxRange) / 2;
  }

  const ratio = (size - minValue) / (maxValue - minValue);
  const computedSize = minRange + ratio * (maxRange - minRange);

  return computedSize;
};

export const scatterSeriesBuilder_labels = (props: LabelBuilderProps) => {
  const { trendlineSeries, datasetOptions } = props;

  if (trendlineSeries.length > 0) {
    // Create a Set of relevant yAxisKeys for O(1) lookup
    const relevantYAxisKeys = new Set(trendlineSeries.map((t) => t.yAxisKey));

    // Combine filtering, flattening and uniqueness in a single pass
    const allTicksForScatter = datasetOptions.datasets
      .filter((dataset) => relevantYAxisKeys.has(dataset.dataKey))
      .flatMap((dataset) => dataset.ticksForScatter || [])
      .sort((a, b) => {
        const aVal = a[0],
          bVal = b[0];
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      })
      .filter((tick, index, array) => index === 0 || tick[0] !== array[index - 1][0]);

    const modifyFiedProps = {
      ...props,
      datasetOptions: {
        ...props.datasetOptions,
        ticks: allTicksForScatter
      }
    };

    return lineSeriesBuilder_labels(modifyFiedProps);
  }

  return undefined;
};
