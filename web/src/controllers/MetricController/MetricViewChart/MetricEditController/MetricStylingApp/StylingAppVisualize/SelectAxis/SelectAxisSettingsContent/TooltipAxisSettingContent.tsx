import { useUpdateMetricChart } from '@/context/Metrics';
import { useMemoizedFn } from '@/hooks';
import React from 'react';
import type { SelectAxisContainerId } from '../config';
import { useSelectAxisContextSelector } from '../useSelectAxisContext';
import { EditShowTooltip } from './EditShowTooltip';

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
