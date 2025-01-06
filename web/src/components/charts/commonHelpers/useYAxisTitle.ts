import { useMemo } from 'react';
import { BusterChartConfigProps, ChartEncodes } from '../interfaces';
import { formatLabel } from '@/utils/columnFormatter';
import { AXIS_TITLE_SEPARATOR } from '@/components/charts/commonHelpers/axisHelper';
import { truncateWithEllipsis } from './titleHelpers';

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
