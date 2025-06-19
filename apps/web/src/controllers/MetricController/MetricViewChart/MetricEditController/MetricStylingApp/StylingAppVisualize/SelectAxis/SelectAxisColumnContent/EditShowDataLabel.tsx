import React from 'react';
import type { ColumnSettings } from '@/api/asset_interfaces/metric/charts';
import { Switch } from '@/components/ui/switch';
import { LabelAndInput } from '../../../Common/LabelAndInput';
import { WarningIcon } from '../../../Common/WarningIcon';

export const EditShowDataLabel: React.FC<{
  showDataLabels: Required<ColumnSettings>['showDataLabels'];
  rowCount: number;
  onUpdateColumnSettingConfig: (columnSettings: Partial<ColumnSettings>) => void;
}> = React.memo(({ showDataLabels, rowCount, onUpdateColumnSettingConfig }) => {
  return (
    <LabelAndInput label="Show data labels">
      <div className="flex w-full justify-end gap-x-2">
        <WarningIcon rowCount={rowCount} />
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
