import type { BusterChartProps } from '@/api/asset_interfaces/metric';
import { formatLabel } from '@/lib/columnFormatter';

export const formatChartLabel = (
  label: string,
  key: string,
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>
): string => {
  return formatLabel(label, columnLabelFormats[key], true);
};
