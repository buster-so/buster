import type {
  ChartType,
  BusterChartProps,
  ChartEncodes
} from '@/api/asset_interfaces/metric/charts';
import type { ChartProps } from '../../core';
import type { ChartType as ChartJSChartType } from 'chart.js';

export interface UseChartSpecificOptionsProps {
  selectedChartType: ChartType;
  pieShowInnerLabel: BusterChartProps['pieShowInnerLabel'];
  pieInnerLabelTitle: BusterChartProps['pieInnerLabelTitle'];
  pieInnerLabelAggregate: BusterChartProps['pieInnerLabelAggregate'];
  pieDonutWidth: BusterChartProps['pieDonutWidth'];
  pieLabelPosition: BusterChartProps['pieLabelPosition'];
  pieDisplayLabelAs: BusterChartProps['pieDisplayLabelAs'];
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>;
  selectedAxis: ChartEncodes;
  barShowTotalAtTop: BusterChartProps['barShowTotalAtTop'];
  columnSettings: BusterChartProps['columnSettings'];
  barGroupType: BusterChartProps['barGroupType'];
  data: ChartProps<ChartJSChartType>['data'];
}

export type ChartSpecificOptionsProps = Omit<UseChartSpecificOptionsProps, 'selectedChartType'>;
