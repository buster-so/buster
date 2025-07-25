import React from 'react';
import type { ColumnLabelFormat } from '@buster/server-shared/metrics';
import { Input } from '@/components/ui/inputs';
import { LabelAndInput } from '../../../Common/LabelAndInput';

export const EditPrefix: React.FC<{
  prefix: ColumnLabelFormat['prefix'];
  onUpdateColumnConfig: (columnLabelFormat: Partial<ColumnLabelFormat>) => void;
}> = React.memo(({ prefix, onUpdateColumnConfig }) => {
  return (
    <LabelAndInput label="Prefix" dataTestId="edit-prefix-input">
      <Input
        className="w-full!"
        min={0}
        placeholder="$"
        value={prefix}
        onChange={(e) =>
          onUpdateColumnConfig({
            prefix: e.target.value ?? ''
          })
        }
      />
    </LabelAndInput>
  );
});
EditPrefix.displayName = 'EditPrefix';
