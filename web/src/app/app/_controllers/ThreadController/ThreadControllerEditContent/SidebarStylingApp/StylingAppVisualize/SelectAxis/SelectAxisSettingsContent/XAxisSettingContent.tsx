import { useBusterThreadsContextSelector } from '@/context/Threads';
import React, { useMemo } from 'react';
import { useSelectAxisContextSelector } from '../useSelectAxisContext';
import { ColumnLabelFormat } from '@/components/charts';
import { formatLabel } from '@/utils';
import { useMemoizedFn } from 'ahooks';
import { IBusterThreadMessageChartConfig } from '@/api/buster_rest/threads/threadConfigInterfaces';
import { EditShowAxisTitle } from './EditShowAxisTitle';
import { EditShowAxisLabel } from './EditShowAxisLabel';
import { EditAxisLabelRotation } from './EditAxisLabelRotation';
import { AXIS_TITLE_SEPARATOR } from '@/components/charts/commonHelpers';

export const XAxisSettingContent: React.FC<{}> = React.memo(({}) => {
  const onUpdateMessageChartConfig = useBusterThreadsContextSelector(
    ({ onUpdateMessageChartConfig }) => onUpdateMessageChartConfig
  );
  const xAxisAxisTitle = useSelectAxisContextSelector((x) => x.xAxisAxisTitle);
  const columnLabelFormats = useSelectAxisContextSelector((x) => x.columnLabelFormats);
  const xAxisShowAxisLabel = useSelectAxisContextSelector((x) => x.xAxisShowAxisLabel);
  const xAxisLabelRotation = useSelectAxisContextSelector((x) => x.xAxisLabelRotation);
  const xAxisShowAxisTitle = useSelectAxisContextSelector((x) => x.xAxisShowAxisTitle);
  const selectedAxis = useSelectAxisContextSelector((x) => x.selectedAxis);

  const xAxis: string[] = useMemo(() => {
    return selectedAxis?.x || [];
  }, [selectedAxis]);

  const assosciatedColumnLabelFormats: ColumnLabelFormat[] = useMemo(() => {
    return xAxis.map((x) => columnLabelFormats[x]) || [];
  }, [columnLabelFormats, xAxis]);

  const formattedColumnTitle: string = useMemo(() => {
    return xAxis
      .map((columnId) => {
        return formatLabel(columnId, columnLabelFormats[columnId], true);
      })
      .join(AXIS_TITLE_SEPARATOR);
  }, [xAxisAxisTitle, xAxis, assosciatedColumnLabelFormats]);

  const onChangeAxisTitle = useMemoizedFn((value: string | null) => {
    onUpdateMessageChartConfig({
      chartConfig: {
        xAxisAxisTitle: value
      }
    });
  });

  const onChangeShowAxisTitle = useMemoizedFn((value: boolean) => {
    onUpdateMessageChartConfig({
      chartConfig: {
        xAxisShowAxisTitle: value
      }
    });
  });

  const onChangeShowAxisLabel = useMemoizedFn((value: boolean) => {
    onUpdateMessageChartConfig({
      chartConfig: {
        xAxisShowAxisLabel: value
      }
    });
  });

  const onChangeLabelRotation = useMemoizedFn(
    (xAxisLabelRotation: IBusterThreadMessageChartConfig['xAxisLabelRotation']) => {
      onUpdateMessageChartConfig({
        chartConfig: {
          xAxisLabelRotation
        }
      });
    }
  );

  return (
    <>
      <EditShowAxisTitle
        axisTitle={xAxisAxisTitle}
        showAxisTitle={xAxisShowAxisTitle}
        formattedColumnTitle={formattedColumnTitle}
        onChangeAxisTitle={onChangeAxisTitle}
        onChangeShowAxisTitle={onChangeShowAxisTitle}
      />

      <EditShowAxisLabel
        showAxisLabel={xAxisShowAxisLabel}
        onChangeShowAxisLabel={onChangeShowAxisLabel}
      />

      <EditAxisLabelRotation
        xAxisLabelRotation={xAxisLabelRotation}
        onChangeLabelRotation={onChangeLabelRotation}
      />
    </>
  );
});
XAxisSettingContent.displayName = 'XAxisSettingContent';
