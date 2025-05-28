import React from 'react';
import type { SelectAxisContainerId } from '../config';
import { EditShowTooltip } from './EditShowTooltip';
import { useSelectAxisContextSelector } from '../useSelectAxisContext';
import { useMemoizedFn } from '@/hooks';
import { useUpdateMetricChart } from '@/context/Metrics';

export const TooltipAxisSettingContent: React.FC<{
  zoneId: SelectAxisContainerId;
}> = React.memo(({}) => {
  const { onUpdateMetricChartConfig } = useUpdateMetricChart();
  const disableTooltip = useSelectAxisContextSelector((x) => x.disableTooltip);

  const onChangeDisableTooltip = useMemoizedFn((value: boolean) => {
    onUpdateMetricChartConfig({
      chartConfig: {
        disableTooltip: value
      }
    });
  });

  return (
    <div>
      <EditShowTooltip
        disableTooltip={disableTooltip}
        onChangeDisableTooltip={onChangeDisableTooltip}
      />
    </div>
  );
});

TooltipAxisSettingContent.displayName = 'TooltipAxisSettingContent';
