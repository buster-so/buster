import React from 'react';
import { LabelAndInput } from '../Common';
import { Switch } from '@/components/ui/switch';
import { WarningIcon } from '../Common/WarningIcon';

export const EditShowDataLabels: React.FC<{
  showDataLabels: boolean;
  rowCount: number;
  onUpdateDataLabel: (v: boolean) => void;
}> = React.memo(({ showDataLabels, rowCount, onUpdateDataLabel }) => {
  return (
    <LabelAndInput label={'Data labels'}>
      <div className="flex justify-end gap-x-2">
        <WarningIcon rowCount={rowCount} />
        <Switch checked={showDataLabels} onCheckedChange={onUpdateDataLabel} />
      </div>
    </LabelAndInput>
  );
});
EditShowDataLabels.displayName = 'EditShowDataLabels';
