import React from 'react';
import { Switch } from '@/components/ui/switch';
import { LabelAndInput } from '../Common';
import { WarningIcon } from '../Common/WarningIcon';

const ROW_COUNT_THRESHOLD = 25;

export const EditShowDataLabels: React.FC<{
  showDataLabels: boolean;
  rowCount: number;
  onUpdateDataLabel: (v: boolean) => void;
}> = React.memo(({ showDataLabels, rowCount, onUpdateDataLabel }) => {
  const showWarning = rowCount > ROW_COUNT_THRESHOLD;
  return (
    <LabelAndInput label={'Data labels'}>
      <div className="flex justify-end gap-x-2">
        <WarningIcon
          showWarning={showWarning}
          warningText="Data labels will be hidden if there are too many."
        />
        <Switch checked={showDataLabels} onCheckedChange={onUpdateDataLabel} />
      </div>
    </LabelAndInput>
  );
});
EditShowDataLabels.displayName = 'EditShowDataLabels';
