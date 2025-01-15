import React, { useMemo } from 'react';
import { LabelAndInput } from '../Common';
import { IBusterThreadMessageChartConfig } from '@/api/buster-rest/threads/threadConfigInterfaces';
import { Switch } from 'antd';
import { AppMaterialIcons, AppTooltip } from '@/components';
import { createStyles } from 'antd-style';

export const EditPieShowInnerLabel = React.memo(
  ({
    pieShowInnerLabel,
    onUpdateChartConfig
  }: {
    pieShowInnerLabel: IBusterThreadMessageChartConfig['pieShowInnerLabel'];
    onUpdateChartConfig: (config: Partial<IBusterThreadMessageChartConfig>) => void;
  }) => {
    return (
      <LabelAndInput label="Show inner label">
        <div className="flex w-full items-center justify-end space-x-2.5">
          <AppTooltip mouseEnterDelay={0.25}>
            <Switch
              defaultChecked={pieShowInnerLabel}
              onChange={(value) => onUpdateChartConfig({ pieShowInnerLabel: value })}
            />
          </AppTooltip>
        </div>
      </LabelAndInput>
    );
  }
);
EditPieShowInnerLabel.displayName = 'EditPieShowInnerLabel';
