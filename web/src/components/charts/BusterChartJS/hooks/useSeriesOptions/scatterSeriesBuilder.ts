import type { ChartProps } from '../../core';
import { LabelBuilderProps } from './useSeriesOptions';
import { SeriesBuilderProps } from './interfaces';
import { ScriptableContext } from 'chart.js';
import { DEFAULT_CHART_CONFIG } from '@/api/busterv2';
import { addOpacityToColor } from '@/utils/colors';
import { ColumnLabelFormat } from '@/components/charts/interfaces';
import { isDateColumnType } from '@/utils/messages';
import { createDayjsDate } from '@/utils/date';

export const scatterSeriesBuilder_data = ({
  selectedDataset,
  allYAxisKeysIndexes,
  colors,
  sizeKeyIndex,
  scatterDotSize,
  categoryKeys,
  columnLabelFormats,
  xAxisKeys
}: SeriesBuilderProps): ChartProps<'bubble'>['data']['datasets'] => {
  const xAxisKey = xAxisKeys[0];
  const xAxisColumnLabelFormat = columnLabelFormats[xAxisKey];
  const isXAxisDate = isDateColumnType(xAxisColumnLabelFormat.columnType);

  return allYAxisKeysIndexes.map((yKeyIndex, index) => {
    const { index: yIndex, name } = yKeyIndex;
    const color = colors[index % colors.length];
    const backgroundColor = addOpacityToColor(color, 0.6);
    const hoverBackgroundColor = addOpacityToColor(color, 0.9);

    return {
      type: 'bubble',
      elements: {
        point: {
          radius: (context: ScriptableContext<'bubble'>) =>
            radiusMethod(context, sizeKeyIndex, scatterDotSize)
        }
      },
      backgroundColor,
      hoverBackgroundColor,
      borderColor: color,
      label: name,
      data: selectedDataset.source.map((item) => ({
        label: name,
        x: getScatterXValue({ isXAxisDate, xValue: item[0] }) as number,
        y: item[yIndex] as number,
        originalR: sizeKeyIndex ? (item[sizeKeyIndex.index] as number) : undefined
      }))
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

export const scatterSeriesBuilder_labels = ({}: LabelBuilderProps) => {
  return undefined;
};
