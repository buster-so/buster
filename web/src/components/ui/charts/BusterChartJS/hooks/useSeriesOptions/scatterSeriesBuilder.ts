import type { ChartProps } from '../../core';
import { LabelBuilderProps } from './useSeriesOptions';
import { SeriesBuilderProps } from './interfaces';
import { ScriptableContext } from 'chart.js';
import { DEFAULT_CHART_CONFIG, DEFAULT_COLUMN_LABEL_FORMAT } from '@/api/asset_interfaces/metric';
import { addOpacityToColor } from '@/lib/colors';
import { isDateColumnType } from '@/lib/messages';
import { createDayjsDate } from '@/lib/date';
import { lineSeriesBuilder_labels } from './lineSeriesBuilder';
import { extractFieldsFromChain } from '../../../chartHooks';

export const scatterSeriesBuilder_data = ({
  colors,
  scatterDotSize,
  columnLabelFormats,
  xAxisKeys,
  sizeOptions,
  categoryKeys,
  datasetOptions
}: SeriesBuilderProps): ChartProps<'bubble'>['data']['datasets'] => {
  const xAxisKey = xAxisKeys[0];
  const xAxisColumnLabelFormat = columnLabelFormats[xAxisKey] || DEFAULT_COLUMN_LABEL_FORMAT;
  const isXAxisDate = isDateColumnType(xAxisColumnLabelFormat.columnType);

  const assignedColors: Record<
    string,
    {
      color: string;
      backgroundColor: string;
      hoverBackgroundColor: string;
      borderColor: string;
    }
  > = {};

  const hasSizeKeyIndex = sizeOptions !== null;
  const scatterElementConfig = hasSizeKeyIndex
    ? {
        point: {
          radius: (context: ScriptableContext<'bubble'>) =>
            radiusMethod(context, sizeOptions, scatterDotSize)
        }
      }
    : undefined;

  return [];

  // return allYAxisKeysIndexes.flatMap((yKeyIndex, index) => {
  //   const { index: yIndex, name: yName } = yKeyIndex;
  //   return selectedDataset.source.map((item, itemIndex) => {
  //     const name = categoryIndex !== -1 ? String(item[categoryIndex]) : yName;
  //     console.log(categoryIndex, name);

  //     let chosenColors = assignedColors[name];
  //     if (!chosenColors) {
  //       const color =
  //         categoryIndex !== -1 ? colors[itemIndex % colors.length] : colors[index % colors.length];
  //       const backgroundColor = addOpacityToColor(color, 0.6);
  //       const hoverBackgroundColor = addOpacityToColor(color, 0.9);
  //       assignedColors[name] = { color, backgroundColor, hoverBackgroundColor, borderColor: color };
  //       chosenColors = assignedColors[name];
  //     }

  //     return {
  //       label: name,
  //       data: [
  //         {
  //           x: selectedDataset.source[itemIndex][0] as number,
  //           y: selectedDataset.source[itemIndex][yIndex] as number
  //         }
  //       ],
  //       elements: scatterElementConfig,
  //       backgroundColor: chosenColors.backgroundColor,
  //       hoverBackgroundColor: chosenColors.hoverBackgroundColor,
  //       borderColor: chosenColors.borderColor
  //     };
  //   });
  // });
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
  const { trendlineSeries } = props;

  if (trendlineSeries.length > 0) {
    return lineSeriesBuilder_labels(props);
  }

  return undefined;
};
