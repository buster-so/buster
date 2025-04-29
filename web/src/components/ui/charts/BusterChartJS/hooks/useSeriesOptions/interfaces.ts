import type {
  BusterChartProps,
  ChartEncodes,
  ScatterAxis
} from '@/api/asset_interfaces/metric/charts';
import type { DatasetOption, DatasetOptionsWithTicks } from '../../../chartHooks';

export interface SeriesBuilderProps {
  datasetOptions: DatasetOptionsWithTicks;
  columnSettings: NonNullable<BusterChartProps['columnSettings']>;
  colors: string[];
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>;
  xAxisKeys: ChartEncodes['x'];
  categoryKeys: ScatterAxis['category'];
  sizeOptions: {
    key: string;
    minValue: number;
    maxValue: number;
  } | null;
  scatterDotSize: BusterChartProps['scatterDotSize'];
  lineGroupType: BusterChartProps['lineGroupType'];
  selectedChartType: BusterChartProps['selectedChartType'];
  barShowTotalAtTop: BusterChartProps['barShowTotalAtTop'];
  barGroupType: BusterChartProps['barGroupType'];
  yAxisKeys: string[];
  y2AxisKeys: string[];
}
