'use client';

import { isServer } from '@tanstack/react-query';
import type { ChartType as ChartJSChartType, PluginChartOptions } from 'chart.js';
import type { AnnotationPluginOptions } from 'chartjs-plugin-annotation';
import type { Context } from 'chartjs-plugin-datalabels';
import type { DeepPartial } from 'utility-types';
import type {
  BusterChartConfigProps,
  BusterChartProps,
  ColumnLabelFormat
} from '@/api/asset_interfaces/metric/charts';
import { determineFontColorContrast } from '@/lib/colors';
import { formatLabel } from '@/lib/columnFormatter';
import { ArrayOperations } from '@/lib/math';
import { countTotalDigits } from '@/lib/numbers';
import { getPieInnerLabelTitle } from '../../../commonHelpers';
import type { ChartProps } from '../../core';
import type { ChartJSOrUndefined } from '../../core/types';
import type { ChartSpecificOptionsProps } from './interfaces';
import { defaultLabelOptionConfig } from './labelOptionConfig';

type PieOptions = ChartProps<'pie'>['options'] | ChartProps<'doughnut'>['options'];

export const pieOptionsHandler = ({
  pieDonutWidth = 0
}: ChartSpecificOptionsProps): ChartProps<ChartJSChartType>['options'] => {
  const result: PieOptions = {
    cutout: pieDonutWidth ? `${pieDonutWidth + 35}%` : 0
  };

  return result as ChartProps<ChartJSChartType>['options'];
};

const titleColor = isServer
  ? '#575859'
  : getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary');

const valueColor = isServer
  ? '#575859'
  : getComputedStyle(document.documentElement).getPropertyValue('--color-text-default');

export const piePluginsHandler = ({
  pieInnerLabelTitle,
  pieInnerLabelAggregate = 'sum',
  pieShowInnerLabel,
  columnLabelFormats,
  pieLabelPosition,
  pieDisplayLabelAs,
  selectedAxis,
  pieDonutWidth
}: ChartSpecificOptionsProps): DeepPartial<PluginChartOptions<ChartJSChartType>>['plugins'] => {
  let returnValue: DeepPartial<PluginChartOptions<ChartJSChartType>>['plugins'] = {};

  if (pieShowInnerLabel && pieDonutWidth !== 0) {
    const annotation: AnnotationPluginOptions = {
      annotations: {
        donutInnerLabel: {
          display: pieShowInnerLabel,
          type: 'doughnutLabel' as 'label', //this is incorrectly typed in the package...
          content: ({ chart }) => {
            const firstDatasetIndex = 0; //we can assume there is only one dataset
            const datasets = chart.data.datasets;
            const firstDatasetData = datasets[firstDatasetIndex].data as number[];
            return [
              getPieInnerLabelTitle(pieInnerLabelTitle, pieInnerLabelAggregate),
              getInnerLabelValue(
                chart,
                firstDatasetData,
                pieInnerLabelAggregate,
                selectedAxis,
                columnLabelFormats
              )
            ];
          },
          font: [
            { size: 22 }, // title font
            { size: 28 } // value font
          ],
          color: [titleColor, valueColor]
        }
      }
    };
    returnValue = { annotation };
  }

  const usePercent = pieDisplayLabelAs === 'percent';
  const numberOfYAxis = selectedAxis.y.length;

  returnValue = {
    ...returnValue,
    outlabels:
      pieLabelPosition === 'outside' && numberOfYAxis === 1
        ? {
            display: true,
            usePercent,
            formatter: (value: number) => {
              return labelFormatter(value, selectedAxis, columnLabelFormats, usePercent);
            }
          }
        : false,
    datalabels: {
      display: pieLabelPosition === 'inside' ? 'auto' : false,
      anchor: 'center',
      borderWidth: 0,
      borderRadius: defaultLabelOptionConfig.borderRadius,
      padding: 2,
      backgroundColor: ({ dataIndex, chart }) => {
        const backgroundColor = chart.options.backgroundColor as string[];
        return backgroundColor[dataIndex];
      },
      color: ({ dataIndex, chart }) => {
        const backgroundColor = chart.options.backgroundColor as string[];
        const color = backgroundColor[dataIndex];
        return determineFontColorContrast(color);
      },
      formatter: (value: number, context) => {
        return labelFormatter(
          usePercent ? percentFormatter(context, value) : value,
          selectedAxis,
          columnLabelFormats,
          usePercent
        );
      }
    }
  };

  return returnValue;
};

const getInnerLabelValue = (
  chart: ChartJSOrUndefined,
  firstDatasetData: number[],
  pieInnerLabelAggregate: BusterChartConfigProps['pieInnerLabelAggregate'],
  selectedAxis: ChartSpecificOptionsProps['selectedAxis'],
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>
): string => {
  try {
    const activeLegendItems =
      chart?.legend?.legendItems?.filter((item) => item.hidden === false) || [];
    const dataByActiveLegendItems = activeLegendItems.map((item) => {
      const index = item.index as number;
      return firstDatasetData[index];
    });
    const operator = new ArrayOperations(dataByActiveLegendItems);
    const result = operator[pieInnerLabelAggregate || 'average']();

    if (pieInnerLabelAggregate === 'count') {
      return result.toString();
    }

    const yColumn = selectedAxis.y[0] || 'defaultYColumn';
    const yColumnLabel = columnLabelFormats[yColumn];

    const formattedLabel = formatLabel(result, {
      ...yColumnLabel,
      compactNumbers: yColumnLabel?.compactNumbers || countTotalDigits(result) >= 9
    });
    return formattedLabel;
  } catch (error) {
    return '';
  }
};

const percentStyle: ColumnLabelFormat = {
  columnType: 'number',
  style: 'percent'
};

const labelFormatter = (
  value: number,
  selectedAxis: ChartSpecificOptionsProps['selectedAxis'],
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>,
  usePercent: boolean
) => {
  if (usePercent) {
    return formatLabel(value, percentStyle);
  }

  const yColumn = selectedAxis.y[0] || 'defaultYColumn';
  const yColumnLabel = columnLabelFormats[yColumn];
  const formattedLabel = formatLabel(value, yColumnLabel);
  return formattedLabel;
};

const percentFormatter = (context: Context, value: number) => {
  const total = (context.dataset.data as number[]).reduce(
    (sum: number, val: number) => sum + val,
    0
  );
  const result = (value / total) * 100 || 0;

  return result;
};
