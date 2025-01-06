import React, { useMemo } from 'react';
import { useSelectAxisContextSelector } from '../useSelectAxisContext';
import { SelectAxisContainerId } from '../config';
import { EditShowAxisTitle } from './EditShowAxisTitle';
import type { ColumnLabelFormat, ComboChartAxis } from '@/components/charts/interfaces';
import { AXIS_TITLE_SEPARATOR } from '@/components/charts/commonHelpers';
import { formatLabel } from '@/utils';
import { useMemoizedFn } from 'ahooks';
import { useBusterThreadsContextSelector } from '@/context/Threads';
import { EditShowAxisLabel } from './EditShowAxisLabel';
import { EditAxisScale } from './EditAxisScale';
import type { IBusterThreadMessageChartConfig } from '@/api/busterv2/threads/threadConfigInterfaces';

export const Y2AxisSettingContent: React.FC<{
  zoneId: SelectAxisContainerId;
}> = React.memo(({}) => {
  const onUpdateMessageChartConfig = useBusterThreadsContextSelector(
    ({ onUpdateMessageChartConfig }) => onUpdateMessageChartConfig
  );
  const selectedAxis = useSelectAxisContextSelector((x) => x.selectedAxis) as ComboChartAxis;
  const columnLabelFormats = useSelectAxisContextSelector((x) => x.columnLabelFormats);
  const y2AxisAxisTitle = useSelectAxisContextSelector((x) => x.y2AxisAxisTitle);
  const y2AxisShowAxisLabel = useSelectAxisContextSelector((x) => x.y2AxisShowAxisLabel);
  const y2AxisScaleType = useSelectAxisContextSelector((x) => x.y2AxisScaleType);
  const y2AxisShowAxisTitle = useSelectAxisContextSelector((x) => x.y2AxisShowAxisTitle);

  const y2Axis: string[] = useMemo(() => {
    return selectedAxis?.y2 || [];
  }, [selectedAxis]);

  const assosciatedColumnLabelForamts: ColumnLabelFormat[] = useMemo(() => {
    return y2Axis.map((x) => columnLabelFormats[x]) || [];
  }, [columnLabelFormats, y2Axis]);

  const formattedColumnTitle: string = useMemo(() => {
    return y2Axis
      .map((columnId) => {
        return formatLabel(columnId, columnLabelFormats[columnId], true);
      })
      .join(AXIS_TITLE_SEPARATOR);
  }, [y2AxisAxisTitle, y2Axis, assosciatedColumnLabelForamts]);

  const onChangeAxisTitle = useMemoizedFn((value: string | null) => {
    onUpdateMessageChartConfig({
      chartConfig: {
        y2AxisAxisTitle: value
      }
    });
  });

  const onChangeShowAxisLabel = useMemoizedFn((value: boolean) => {
    onUpdateMessageChartConfig({
      chartConfig: {
        y2AxisShowAxisLabel: value
      }
    });
  });

  const onChangeAxisScale = useMemoizedFn(
    (y2AxisScaleType: IBusterThreadMessageChartConfig['y2AxisScaleType']) => {
      onUpdateMessageChartConfig({
        chartConfig: {
          y2AxisScaleType
        }
      });
    }
  );

  const onChangeShowAxisTitle = useMemoizedFn((value: boolean) => {
    onUpdateMessageChartConfig({
      chartConfig: {
        y2AxisShowAxisTitle: value
      }
    });
  });

  return (
    <>
      <EditShowAxisTitle
        axisTitle={y2AxisAxisTitle}
        formattedColumnTitle={formattedColumnTitle}
        onChangeAxisTitle={onChangeAxisTitle}
        onChangeShowAxisTitle={onChangeShowAxisTitle}
        showAxisTitle={y2AxisShowAxisTitle}
      />

      <EditShowAxisLabel
        showAxisLabel={y2AxisShowAxisLabel}
        onChangeShowAxisLabel={onChangeShowAxisLabel}
      />

      <EditAxisScale scaleType={y2AxisScaleType} onChangeAxisScale={onChangeAxisScale} />
    </>
  );
});
Y2AxisSettingContent.displayName = 'Y2AxisSettingContent';
