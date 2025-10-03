import type { ColumnSettings } from '@buster/server-shared/metrics';
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { LabelAndInput } from '../../../Common/LabelAndInput';
import { WarningIcon } from '../../../Common/WarningIcon';

const ROW_COUNT_THRESHOLD = 25;

export const EditShowDataLabel: React.FC<{
  showDataLabels: Required<ColumnSettings>['showDataLabels'];
  rowCount: number;
  onUpdateColumnSettingConfig: (columnSettings: Partial<ColumnSettings>) => void;
}> = React.memo(({ showDataLabels, rowCount, onUpdateColumnSettingConfig }) => {
  const showWarning = rowCount > ROW_COUNT_THRESHOLD;
  return (
    <LabelAndInput label="Show data labels">
      <div className="flex w-full justify-end gap-x-2">
        <WarningIcon
          showWarning={showWarning}
          warningText="Data labels will be hidden if there are too many."
        />
        <Switch
          checked={showDataLabels}
          onCheckedChange={(v) => {
            onUpdateColumnSettingConfig({ showDataLabels: v });
          }}
        />
      </div>
    </LabelAndInput>
  );
});
EditShowDataLabel.displayName = 'EditShowDataLabel';
