import type { ChartProps } from '../../core';
import { LabelBuilderProps } from './useSeriesOptions';
import { SeriesBuilderProps } from './interfaces';
import { ScriptableContext } from 'chart.js';
import { DEFAULT_CHART_CONFIG } from '@/api/busterv2';
import { addOpacityToColor } from '@/utils/colors';

export const scatterSeriesBuilder_data = ({
  selectedDataset,
  allYAxisKeysIndexes,
  colors,
  sizeKeyIndex,
  scatterDotSize,
  categoryKeys,
  columnLabelFormats
}: SeriesBuilderProps): ChartProps<'bubble'>['data']['datasets'] => {
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
        x: item[0] as number,
        y: item[yIndex] as number,
        originalR: sizeKeyIndex ? (item[sizeKeyIndex.index] as number) : undefined
      }))
    };
  });
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
