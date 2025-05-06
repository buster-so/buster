import React from 'react';
import { LabelAndInput } from '../../../Common/LabelAndInput';
import { Switch } from '@/components/ui/switch';

export const EditShowTooltip: React.FC<{
  disableTooltip: boolean;
  onChangeDisableTooltip: (value: boolean) => void;
}> = React.memo(({ disableTooltip, onChangeDisableTooltip }) => {
  return (
    <LabelAndInput label="Disable tooltip">
      <div className="flex justify-end">
        <Switch checked={disableTooltip} onCheckedChange={onChangeDisableTooltip} />
      </div>
    </LabelAndInput>
  );
});
EditShowTooltip.displayName = 'EditShowTooltip';
