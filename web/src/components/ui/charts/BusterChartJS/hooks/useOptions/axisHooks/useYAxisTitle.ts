import { useMemo } from 'react';
import type { BusterChartConfigProps, ChartEncodes } from '@/api/asset_interfaces/metric/charts';
import { formatLabel } from '@/lib/columnFormatter';
import { AXIS_TITLE_SEPARATOR } from '../../../../commonHelpers/axisHelper';
import { truncateWithEllipsis } from '../../../../commonHelpers/titleHelpers';

interface UseYAxisTitleProps {
  yAxis: string[];
  columnLabelFormats: NonNullable<BusterChartConfigProps['columnLabelFormats']>;
  isSupportedChartForAxisTitles: boolean;
  yAxisAxisTitle: BusterChartConfigProps['yAxisAxisTitle'];
  yAxisShowAxisTitle: BusterChartConfigProps['yAxisShowAxisTitle'];
  selectedAxis: ChartEncodes;
}

export const useYAxisTitle = ({
  yAxis,
  columnLabelFormats,
  isSupportedChartForAxisTitles,
  yAxisAxisTitle,
  yAxisShowAxisTitle,
  selectedAxis
}: UseYAxisTitleProps) => {
  const yAxisColumnLabelFormats = useMemo(() => {
    return yAxis.map((y) => columnLabelFormats[y]);
  }, [yAxis, columnLabelFormats]);

  const yAxisTitle: string = useMemo(() => {
    if (!isSupportedChartForAxisTitles || !yAxisShowAxisTitle) return '';

    return truncateWithEllipsis(
      yAxisAxisTitle ||
        selectedAxis.y
          .map((y) => formatLabel(y, columnLabelFormats[y], true))
          .join(AXIS_TITLE_SEPARATOR)
    );
  }, [yAxisAxisTitle, isSupportedChartForAxisTitles, yAxisShowAxisTitle, yAxisColumnLabelFormats]);

  return yAxisTitle;
};
