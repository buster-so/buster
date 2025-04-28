import type { ChartProps } from '../../core';
import { LabelBuilderProps } from './useSeriesOptions';
import { SeriesBuilderProps } from './interfaces';
import { ScriptableContext } from 'chart.js';
import { DEFAULT_CHART_CONFIG, DEFAULT_COLUMN_LABEL_FORMAT } from '@/api/asset_interfaces/metric';
import { addOpacityToColor } from '@/lib/colors';
import { isDateColumnType } from '@/lib/messages';
import { createDayjsDate } from '@/lib/date';
import { lineSeriesBuilder_labels } from './lineSeriesBuilder';

export const scatterSeriesBuilder_data = ({
  selectedDataset,
  allYAxisKeysIndexes,
  colors,
  sizeKeyIndex,
  scatterDotSize,
  columnLabelFormats,
  xAxisKeys
}: SeriesBuilderProps): ChartProps<'bubble'>['data']['datasets'] => {
  const xAxisKey = xAxisKeys[0];
  const xAxisColumnLabelFormat = columnLabelFormats[xAxisKey] || DEFAULT_COLUMN_LABEL_FORMAT;
  const isXAxisDate = isDateColumnType(xAxisColumnLabelFormat.columnType);

  const hasSizeKeyIndex = sizeKeyIndex !== null;
  const scatterElementConfig = hasSizeKeyIndex
    ? {
        point: {
          radius: (context: ScriptableContext<'bubble'>) =>
            radiusMethod(context, sizeKeyIndex, scatterDotSize)
        }
      }
    : undefined;

  return allYAxisKeysIndexes.map((yKeyIndex, index) => {
    const { index: yIndex, name } = yKeyIndex;
    const color = colors[index % colors.length];
    const backgroundColor = addOpacityToColor(color, 0.6);
    const hoverBackgroundColor = addOpacityToColor(color, 0.9);

    return {
      //  type: 'bubble',
      elements: scatterElementConfig,
      backgroundColor,
      hoverBackgroundColor,
      borderColor: color,
      label: name,
      data: selectedDataset.source
        .map((item) => ({
          label: name,
          x: getScatterXValue({ isXAxisDate, xValue: item[0] }) as number,
          y: item[yIndex] as number,
          originalR: sizeKeyIndex ? (item[sizeKeyIndex.index] as number) : undefined
        }))
        .filter((item) => item.y !== null)
    };
  });
};

const getScatterXValue = ({
  isXAxisDate,
  xValue
}: {
  isXAxisDate: boolean;
  xValue: number | string | Date | null;
}): number | Date => {
  if (isXAxisDate && xValue) {
    return createDayjsDate(xValue as string).toDate();
  }

  return xValue as number;
};

const radiusMethod = (
  context: ScriptableContext<'bubble'>,
  sizeKeyIndex: SeriesBuilderProps['sizeKeyIndex'],
  scatterDotSize: SeriesBuilderProps['scatterDotSize']
) => {
  //@ts-ignore
  const originalR = context.raw?.originalR;

  if (typeof originalR === 'number' && sizeKeyIndex) {
    return computeSizeRatio(
      originalR,
      scatterDotSize,
      sizeKeyIndex.minValue,
      sizeKeyIndex.maxValue
    );
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
  const { trendlineSeries } = props;

  if (trendlineSeries.length > 0) {
    return lineSeriesBuilder_labels(props);
  }

  return undefined;
};
