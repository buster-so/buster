import type { BusterChartConfigProps, ChartEncodes } from '@/api/asset_interfaces/metric/charts';
import { formatLabel } from '@/lib/columnFormatter';
import { useMemo } from 'react';
import { AXIS_TITLE_SEPARATOR } from '../../../../commonHelpers/axisHelper';
import { truncateWithEllipsis } from '../../../../commonHelpers/titleHelpers';

interface UseXAxisTitleProps {
  xAxis: string[];
  columnLabelFormats: NonNullable<BusterChartConfigProps['columnLabelFormats']>;
  isSupportedChartForAxisTitles: boolean;
  xAxisAxisTitle: BusterChartConfigProps['xAxisAxisTitle'];
  xAxisShowAxisTitle: BusterChartConfigProps['xAxisShowAxisTitle'];
  selectedAxis: ChartEncodes;
}

export const useXAxisTitle = ({
  xAxis,
  columnLabelFormats,
  isSupportedChartForAxisTitles,
  xAxisAxisTitle,
  xAxisShowAxisTitle,
  selectedAxis
}: UseXAxisTitleProps): string => {
  const xAxisColumnLabelFormats = useMemo(() => {
    return xAxis.map((x) => columnLabelFormats[x]);
  }, [xAxis, isSupportedChartForAxisTitles, columnLabelFormats]);

  const xAxisTitle = useMemo(() => {
    if (!isSupportedChartForAxisTitles || xAxisAxisTitle === '' || !xAxisShowAxisTitle) return '';

    const title =
      xAxisAxisTitle ||
      selectedAxis.x
        .map((x) => formatLabel(x, columnLabelFormats[x], true))
        .join(AXIS_TITLE_SEPARATOR);

    return truncateWithEllipsis(title);
  }, [
    xAxisAxisTitle,
    isSupportedChartForAxisTitles,
    xAxisShowAxisTitle,
    xAxis,
    xAxisColumnLabelFormats
  ]);

  return xAxisTitle;
};
