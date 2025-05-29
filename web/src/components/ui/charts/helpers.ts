import { type ChartEncodes, ChartType } from '@/api/asset_interfaces/metric/charts';
import isEmpty from 'lodash/isEmpty';

const defaultAxisCheck = (selectedAxis: ChartEncodes) => {
  if (isEmpty(selectedAxis.x) || isEmpty(selectedAxis.y)) return false;
  return true;
};

const AxisMethodCheckRecord: Record<ChartType, (selectedAxis: ChartEncodes) => boolean> = {
  [ChartType.Line]: defaultAxisCheck,
  [ChartType.Bar]: defaultAxisCheck,
  [ChartType.Scatter]: defaultAxisCheck,
  [ChartType.Pie]: defaultAxisCheck,
  [ChartType.Combo]: defaultAxisCheck,
  [ChartType.Metric]: () => true,
  [ChartType.Table]: () => true
};

export const doesChartHaveValidAxis = ({
  selectedChartType,
  selectedAxis,
  isTable
}: {
  selectedChartType: ChartType;
  selectedAxis: ChartEncodes | undefined;
  isTable: boolean;
}) => {
  if (isTable) return true;
  if (!selectedAxis) return false;
  return AxisMethodCheckRecord[selectedChartType](selectedAxis);
};
