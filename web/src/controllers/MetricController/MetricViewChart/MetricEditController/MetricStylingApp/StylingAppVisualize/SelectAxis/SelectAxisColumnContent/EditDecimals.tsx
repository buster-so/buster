import React, { useState } from 'react';
import type { IColumnLabelFormat } from '@/api/asset_interfaces/metric/charts/columnLabelInterfaces';
import { InputNumber } from '@/components/ui/inputs';
import { LabelAndInput } from '../../../Common/LabelAndInput';

export const EditDecimals: React.FC<{
  minimumFractionDigits: IColumnLabelFormat['minimumFractionDigits'];
  maximumFractionDigits: IColumnLabelFormat['maximumFractionDigits'];
  onUpdateColumnConfig: (columnLabelFormat: Partial<IColumnLabelFormat>) => void;
}> = React.memo(({ minimumFractionDigits, maximumFractionDigits, onUpdateColumnConfig }) => {
  const [min, setMin] = useState(minimumFractionDigits);
  const [max, setMax] = useState(maximumFractionDigits);

  const handleMinChange = (value: number | null) => {
    const newMin = value ?? 0;
    if (newMin > (max ?? 0)) {
      // If min exceeds max, set both to the same value
      setMin(newMin);
      setMax(newMin);
      onUpdateColumnConfig({
        minimumFractionDigits: newMin,
        maximumFractionDigits: newMin
      });
    } else {
      setMin(newMin);
      onUpdateColumnConfig({ minimumFractionDigits: newMin });
    }
  };

  const handleMaxChange = (value: number | null) => {
    const newMax = value ?? 0;
    if (newMax < (min ?? 0)) {
      // If max goes below min, set both to the same value
      setMin(newMax);
      setMax(newMax);
      onUpdateColumnConfig({
        minimumFractionDigits: newMax,
        maximumFractionDigits: newMax
      });
    } else {
      setMax(newMax);
      onUpdateColumnConfig({ maximumFractionDigits: newMax });
    }
  };

  return (
    <LabelAndInput label="Decimals">
      <div className="flex w-full items-center space-x-2" data-testid="edit-decimals-input">
        <InputNumber
          min={0}
          prefix="Min"
          value={min}
          className="w-full!"
          onChange={(value) => handleMinChange(value)}
        />
        <InputNumber
          prefix="Max"
          max={10}
          value={max}
          className="w-full!"
          onChange={(value) => handleMaxChange(value)}
        />
      </div>
    </LabelAndInput>
  );
});
EditDecimals.displayName = 'EditDecimals';
