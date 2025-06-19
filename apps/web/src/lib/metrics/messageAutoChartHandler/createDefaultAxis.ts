import { type ColumnMetaData, DEFAULT_CHART_CONFIG } from '@/api/asset_interfaces/metric';
import type {
  BarAndLineAxis,
  PieChartAxis,
  ScatterAxis
} from '@/api/asset_interfaces/metric/charts';

export const createDefaultBarAndLineAxis = (
  columnsMetaData: ColumnMetaData[] | undefined
): BarAndLineAxis => {
  const firstDateColumn = columnsMetaData?.find((m) => m.simple_type === 'date');
  const firstNumberColumn = columnsMetaData?.find((m) => m.simple_type === 'number');
  const firstStringColumn = columnsMetaData?.find((m) => m.simple_type === 'text');
  return {
    ...DEFAULT_CHART_CONFIG.barAndLineAxis,
    x: [firstDateColumn?.name || firstStringColumn?.name].filter(Boolean) as string[],
    y: [firstNumberColumn?.name].filter(Boolean) as string[]
  };
};

export const createDefaultPieAxis = (
  columnsMetaData: ColumnMetaData[] | undefined
): PieChartAxis => {
  const firstNumberColumn = columnsMetaData?.find((m) => m.simple_type === 'number');
  const firstStringColumn = columnsMetaData?.find((m) => m.simple_type === 'text');
  const firstDateColumn = columnsMetaData?.find((m) => m.simple_type === 'date');
  return {
    ...DEFAULT_CHART_CONFIG.pieChartAxis,
    x: [firstStringColumn?.name || firstDateColumn?.name].filter(Boolean) as string[],
    y: [firstNumberColumn?.name].filter(Boolean) as string[]
  };
};

export const createDefaultScatterAxis = (
  columnsMetaData: ColumnMetaData[] | undefined
): ScatterAxis => {
  const firstNumberColumn = columnsMetaData?.find((m) => m.simple_type === 'number');
  const secondNumberColumn = columnsMetaData?.find(
    (m) => m.simple_type === 'number' && m.name !== firstNumberColumn?.name
  );
  return {
    ...DEFAULT_CHART_CONFIG.scatterAxis,
    x: [firstNumberColumn?.name].filter(Boolean) as string[],
    y: [secondNumberColumn?.name].filter(Boolean) as string[]
  };
};
