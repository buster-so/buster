import isEmpty from 'lodash/isEmpty';
import { type ChartEncodes, ChartType } from '@/api/asset_interfaces/metric/charts';

const defaultAxisCheck = (selectedAxis: ChartEncodes) => {
  if (isEmpty(selectedAxis.x) || isEmpty(selectedAxis.y)) return false;
  return true;
};

const AxisMethodCheckRecord: Record<ChartType, (selectedAxis: ChartEncodes) => boolean> = {
  ['line']: defaultAxisCheck,
  ['bar']: defaultAxisCheck,
  ['scatter']: defaultAxisCheck,
  ['pie']: defaultAxisCheck,
  ['combo']: defaultAxisCheck,
  ['metric']: (selectedAxis) => true,
  ['table']: () => true
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

  return AxisMethodCheckRecord[selectedChartType](selectedAxis as ChartEncodes);
};
