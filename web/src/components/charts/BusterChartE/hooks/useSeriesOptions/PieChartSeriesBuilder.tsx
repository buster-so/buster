import type { PieSeriesOption, LabelFormatterCallback } from 'echarts';
import {
  BusterChartConfigProps,
  BusterChartProps,
  ChartEncodes,
  PieChartAxis
} from '../../../interfaces';
import { busterAppStyleConfig } from '@/styles/busterAntDStyleConfig';
import { DataFrameOperations } from '@/utils/math';
import { formatLabel } from '@/utils';
import { DatasetOption, extractFieldsFromChain } from '../../../chartHooks';

import { DEFAULT_CHART_CONFIG, MIN_DONUT_WIDTH } from '@/api/buster_rest';
import busterLightTheme, { labelContrastFormatter } from '../useEChartsTheme/buster_light_theme';
import { getPieInnerLabelTitle } from '../../../commonHelpers/pieLabelHelpers';

const MAX_DONUT_WIDTH = 75;
const token = busterAppStyleConfig.token!;

const determineMaxDonutWidth = (pieLabelPosition: BusterChartProps['pieLabelPosition']) => {
  if (pieLabelPosition === 'outside') return MAX_DONUT_WIDTH - 25;
  return MAX_DONUT_WIDTH;
};

const determineDonutWidth = (
  pieDonutWidth: number,
  pieLabelPosition: BusterChartProps['pieLabelPosition']
) => {
  if (pieDonutWidth === 0) return 0;

  if (pieLabelPosition === 'outside') {
    return pieDonutWidth - 10;
  }
  return pieDonutWidth + 13;
};

export const PieChartBuilder = ({
  columnLabelFormats,
  y,
  datasets,
  index,
  pieDonutWidth,
  pieShowInnerLabel,
  pieLabelPosition,
  pieInnerLabelTitle,
  pieInnerLabelAggregate,
  pieDisplayLabelAs,
  selectedAxis
}: {
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>;
  y: string;
  datasets: DatasetOption[];
  index: number;
  pieDonutWidth: number;
  pieShowInnerLabel: boolean;
  pieLabelPosition: BusterChartProps['pieLabelPosition'];
  pieInnerLabelTitle: BusterChartProps['pieInnerLabelTitle'];
  pieInnerLabelAggregate: BusterChartProps['pieInnerLabelAggregate'];
  pieDisplayLabelAs: BusterChartProps['pieDisplayLabelAs'];
  selectedAxis: ChartEncodes;
}): PieSeriesOption[] => {
  const pieChartAxis = selectedAxis as PieChartAxis;
  const hasMultipleSeries = pieChartAxis && (pieChartAxis.y?.length || 1) > 1;
  const donutWidth = pieDonutWidth ?? DEFAULT_CHART_CONFIG.pieDonutWidth;
  const showInnerLabel = pieShowInnerLabel ?? donutWidth > 20;

  const showLabelLogic = () => {
    if (pieLabelPosition === 'none') return false;
    return !!pieLabelPosition;
  };

  const dountWidthLogic = () => {
    const maxRadius = determineMaxDonutWidth(pieLabelPosition) - 3;
    //if there are multiple series, we need to space them out
    if (hasMultipleSeries) {
      const numberOfSeries = pieChartAxis.y.length;

      const spacing = numberOfSeries === 2 ? 10 : 6;
      const seriesWidth = (maxRadius - spacing * (numberOfSeries - 1)) / numberOfSeries;
      const startRadius = index * (seriesWidth + spacing);
      const endRadius = startRadius + seriesWidth;
      return [`${startRadius}%`, `${endRadius}%`];
    }

    return [`${determineDonutWidth(donutWidth, pieLabelPosition)}%`, `${maxRadius}%`];
  };

  const { key: yKey } = extractFieldsFromChain(y)[0];
  const columnLabelFormat = columnLabelFormats[yKey];

  const defaultSeries: PieSeriesOption = {
    name: y,
    type: 'pie',
    roseType: undefined,
    encode: { value: y, itemName: 0, x: 0 },
    radius: dountWidthLogic(), //donut size
    label: {
      show: showLabelLogic(),
      position: pieLabelPosition as 'outside', //outside, inside, center
      formatter: ({ data, percent, encode, color }: Parameters<LabelFormatterCallback>[0]) => {
        const encodeValue = encode?.value[0] || 1;
        const rawValue = (data as any)[encodeValue];
        const displayValue =
          pieDisplayLabelAs === 'percent'
            ? `${percent}%`
            : formatLabel(rawValue, columnLabelFormat);
        return labelContrastFormatter(displayValue, color as string);
      }
    },
    emphasis: {
      label: {
        show: pieLabelPosition !== 'none'
      }
    },
    datasetIndex: datasets.length - 1
  };

  if (defaultSeries.label?.show) {
    if (defaultSeries.label.position === 'inside') {
      defaultSeries.label = defaultSeries.label;
    } else {
      defaultSeries.label = {
        ...defaultSeries.label,
        backgroundColor: busterLightTheme.theme.label.backgroundColor,
        borderWidth: busterLightTheme.theme.label.borderWidth
      };
    }
  }

  const series = [defaultSeries];

  if (!hasMultipleSeries && showInnerLabel && donutWidth >= MIN_DONUT_WIDTH) {
    series.push(
      InnerLabelBuilder({
        datasets,
        pieInnerLabelTitle,
        columnLabelFormats,
        pieInnerLabelAggregate
      })
    );
  }

  return series;
};

export const TOTAL_INNER_LABEL_ID = '_total_inner_label_🏷️';

const InnerLabelBuilder = ({
  datasets,
  pieInnerLabelTitle,
  pieInnerLabelAggregate,
  columnLabelFormats
}: {
  datasets: DatasetOption[];
  pieInnerLabelTitle: BusterChartProps['pieInnerLabelTitle'];
  pieInnerLabelAggregate: BusterChartProps['pieInnerLabelAggregate'];
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>;
}): PieSeriesOption => {
  return {
    name: TOTAL_INNER_LABEL_ID,
    type: 'pie',
    datasetIndex: datasets.length - 1,
    radius: ['100%', '100%'],
    silent: true,
    label: {
      show: true,
      position: 'center',
      borderWidth: 0,
      backgroundColor: 'transparent',
      formatter: [
        `{title|${getPieInnerLabelTitle(pieInnerLabelTitle, pieInnerLabelAggregate)}}`,
        '\n',
        `{value|${getInnerLabelValue(datasets, pieInnerLabelAggregate, columnLabelFormats)}}`
      ].join(''),
      rich: {
        title: {
          color: token.colorTextSecondary,
          fontSize: 13,
          fontWeight: 'normal',
          padding: [-2, 0, 6, 0]
        },
        value: {
          color: token.colorText,
          fontSize: 24,
          fontWeight: 'normal',
          verticalAlign: 'middle',
          padding: [0, 0, 0, 0]
        }
      }
    },
    emphasis: {
      disabled: true
    }
  };
};

const getInnerLabelValue = (
  datasets: DatasetOption[],
  pieInnerLabelAggregate: BusterChartConfigProps['pieInnerLabelAggregate'] = 'sum',
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>
): string | number => {
  try {
    const isCount = pieInnerLabelAggregate === 'count';
    const dimensions = datasets[datasets.length - 1].dimensions! as string[];
    const { key: yKey } = extractFieldsFromChain(dimensions[1])[0];
    let columnLabelFormat = columnLabelFormats[yKey];
    if (isCount) {
      columnLabelFormat = {
        style: 'number',
        columnType: 'number'
      };
    }
    const operator = new DataFrameOperations(
      datasets[datasets.length - 1].source as [string | number, ...number[]][]
    );
    const result = operator[pieInnerLabelAggregate]();
    return formatLabel(result, columnLabelFormat);
  } catch (error) {
    return 0;
  }
};
