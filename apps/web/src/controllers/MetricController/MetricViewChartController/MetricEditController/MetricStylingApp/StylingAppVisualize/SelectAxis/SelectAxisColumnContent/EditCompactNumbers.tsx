import type { ColumnLabelFormat } from '@buster/server-shared/metrics';
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { LabelAndInput } from '../../../Common/LabelAndInput';

export const EditCompactNumbers: React.FC<{
  compactNumbers: ColumnLabelFormat['compactNumbers'];
  onUpdateColumnConfig: (columnLabelFormat: Partial<ColumnLabelFormat>) => void;
}> = React.memo(({ compactNumbers, onUpdateColumnConfig }) => {
  const onChange = (v: boolean) => {
    onUpdateColumnConfig({ compactNumbers: v });
  };

  return (
    <LabelAndInput label="Compact numbers">
      <div className="flex justify-end">
        <Switch checked={compactNumbers} onCheckedChange={onChange} />
      </div>
    </LabelAndInput>
  );
});
EditCompactNumbers.displayName = 'EditCompactNumbers';
