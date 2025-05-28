import type { IColumnLabelFormat } from '@/api/asset_interfaces/metric/charts/columnLabelInterfaces';
import { InputNumber } from '@/components/ui/inputs';
import React from 'react';
import { LabelAndInput } from '../../../Common/LabelAndInput';

export const EditMultiplyBy: React.FC<{
  multiplier: IColumnLabelFormat['multiplier'];
  onUpdateColumnConfig: (columnLabelFormat: Partial<IColumnLabelFormat>) => void;
}> = React.memo(({ multiplier, onUpdateColumnConfig }) => {
  return (
    <LabelAndInput label="Multiply By" dataTestId="edit-multiply-by-input">
      <InputNumber
        placeholder="1"
        className="w-full!"
        min={0}
        value={multiplier}
        onChange={(value) =>
          onUpdateColumnConfig({
            multiplier: value ?? 1
          })
        }
      />
    </LabelAndInput>
  );
});
EditMultiplyBy.displayName = 'EditMultiplyBy';
