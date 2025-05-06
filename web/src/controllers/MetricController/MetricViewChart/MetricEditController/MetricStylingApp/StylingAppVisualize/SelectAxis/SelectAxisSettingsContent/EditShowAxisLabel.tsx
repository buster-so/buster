import React from 'react';
import { LabelAndInput } from '../../../Common/LabelAndInput';
import { Switch } from '@/components/ui/switch';

export const EditShowAxisLabel: React.FC<{
  showAxisLabel: boolean;
  onChangeShowAxisLabel: (value: boolean) => void;
}> = React.memo(({ showAxisLabel, onChangeShowAxisLabel }) => {
  return (
    <LabelAndInput label="Show axis label">
      <div className="flex justify-end">
        <Switch checked={showAxisLabel} onCheckedChange={onChangeShowAxisLabel} />
      </div>
    </LabelAndInput>
  );
});
EditShowAxisLabel.displayName = 'EditShowAxisLabel';
