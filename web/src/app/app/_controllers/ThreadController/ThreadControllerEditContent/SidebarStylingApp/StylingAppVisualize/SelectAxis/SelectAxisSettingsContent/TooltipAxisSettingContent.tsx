import React from 'react';
import { SelectAxisContainerId } from '../config';
import { useBusterThreadsContextSelector } from '@/context/Threads';
import { EditShowTooltip } from './EditShowTooltip';
import { useSelectAxisContextSelector } from '../useSelectAxisContext';
import { useMemoizedFn } from 'ahooks';

export const TooltipAxisSettingContent: React.FC<{
  zoneId: SelectAxisContainerId;
}> = React.memo(({}) => {
  const disableTooltip = useSelectAxisContextSelector((x) => x.disableTooltip);

  const onUpdateMessageChartConfig = useBusterThreadsContextSelector(
    ({ onUpdateMessageChartConfig }) => onUpdateMessageChartConfig
  );

  const onChangeDisableTooltip = useMemoizedFn((value: boolean) => {
    onUpdateMessageChartConfig({
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
