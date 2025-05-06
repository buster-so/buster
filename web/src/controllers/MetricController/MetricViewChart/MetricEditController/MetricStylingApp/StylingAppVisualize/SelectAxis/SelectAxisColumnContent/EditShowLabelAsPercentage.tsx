import React from 'react';
import { LabelAndInput } from '../../../Common/LabelAndInput';
import { Switch } from '@/components/ui/switch';
import { useMemoizedFn } from '@/hooks';
import { ColumnSettings } from '@/api/asset_interfaces/metric/charts';

export const EditShowBarLabelAsPercentage: React.FC<{
  onUpdateColumnSettingConfig: (columnSettings: Partial<ColumnSettings>) => void;
  showDataLabelsAsPercentage: ColumnSettings['showDataLabelsAsPercentage'];
}> = React.memo(({ onUpdateColumnSettingConfig, showDataLabelsAsPercentage }) => {
  const onChange = useMemoizedFn((v: boolean) => {
    onUpdateColumnSettingConfig({ showDataLabelsAsPercentage: v });
  });

  return (
    <LabelAndInput label="Show label as %">
      <div className="flex justify-end">
        <Switch checked={showDataLabelsAsPercentage} onCheckedChange={onChange} />
      </div>
    </LabelAndInput>
  );
});
EditShowBarLabelAsPercentage.displayName = 'EditShowLabelAsPercentage';
