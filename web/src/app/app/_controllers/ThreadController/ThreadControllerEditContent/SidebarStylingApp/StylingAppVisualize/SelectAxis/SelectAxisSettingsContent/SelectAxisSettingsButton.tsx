import { AppMaterialIcons, AppPopover } from '@/components';
import { Button } from 'antd';
import React, { useMemo } from 'react';
import { SelectAxisContainerId } from '../config';
import { SelectAxisSettingContent } from './SelectAxisSettingContent';
import { useSelectAxisContextSelector } from '../useSelectAxisContext';
import { zoneIdToAxisSettingContent } from './config';

export const SelectAxisSettingsButton: React.FC<{
  zoneId: SelectAxisContainerId;
}> = React.memo(({ zoneId }) => {
  const selectedChartType = useSelectAxisContextSelector((x) => x.selectedChartType);

  const canUseAxisSetting = useMemo(() => {
    if (zoneIdToAxisSettingContent[zoneId] === null) return false;
    if (selectedChartType === 'pie' && zoneId !== 'tooltip') return false;
    return true;
  }, [selectedChartType, zoneId]);

  if (!canUseAxisSetting) return null;

  return (
    <AppPopover
      content={<SelectAxisSettingContent zoneId={zoneId} />}
      trigger="click"
      destroyTooltipOnHide
      performant
      placement="leftBottom">
      <Button type="text" icon={<AppMaterialIcons icon="tune" />} />
    </AppPopover>
  );
});
SelectAxisSettingsButton.displayName = 'SelectAxisSettingsButton';
