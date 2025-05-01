import { formatLabel } from '@/lib/columnFormatter';
import { useMemo } from 'react';
import { AXIS_TITLE_SEPARATOR } from '../../../../commonHelpers/axisHelper';
import type { BusterChartConfigProps } from '@/api/asset_interfaces/metric/charts';
import { truncateWithEllipsis } from '../../../../commonHelpers/titleHelpers';

export const useY2AxisTitle = ({
  y2Axis,
  columnLabelFormats,
  isSupportedChartForAxisTitles,
  y2AxisAxisTitle,
  y2AxisShowAxisTitle
}: {
  y2Axis: string[];
  columnLabelFormats: NonNullable<BusterChartConfigProps['columnLabelFormats']>;
  isSupportedChartForAxisTitles: boolean;
  y2AxisAxisTitle: BusterChartConfigProps['y2AxisAxisTitle'];
  y2AxisShowAxisTitle: BusterChartConfigProps['y2AxisShowAxisTitle'];
}) => {
  const y2AxisColumnLabelFormats = useMemo(() => {
    return y2Axis.map((y) => columnLabelFormats[y]);
  }, [y2Axis, columnLabelFormats]);

  const y2AxisTitle = useMemo(() => {
    if (!isSupportedChartForAxisTitles || !y2AxisShowAxisTitle) return '';
    return truncateWithEllipsis(
      y2AxisAxisTitle ||
        y2Axis.map((y) => formatLabel(y, columnLabelFormats[y], true)).join(AXIS_TITLE_SEPARATOR)
    );
  }, [
    y2AxisAxisTitle,
    isSupportedChartForAxisTitles,
    y2AxisShowAxisTitle,
    y2AxisColumnLabelFormats
  ]);

  return y2AxisTitle;
};
