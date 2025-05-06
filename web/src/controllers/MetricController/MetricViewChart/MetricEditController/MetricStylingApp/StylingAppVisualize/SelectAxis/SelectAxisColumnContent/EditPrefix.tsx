import React from 'react';
import { LabelAndInput } from '../../../Common/LabelAndInput';
import type { IColumnLabelFormat } from '@/api/asset_interfaces/metric/charts/columnLabelInterfaces';
import { Input } from '@/components/ui/inputs';

export const EditPrefix: React.FC<{
  prefix: IColumnLabelFormat['prefix'];
  onUpdateColumnConfig: (columnLabelFormat: Partial<IColumnLabelFormat>) => void;
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
