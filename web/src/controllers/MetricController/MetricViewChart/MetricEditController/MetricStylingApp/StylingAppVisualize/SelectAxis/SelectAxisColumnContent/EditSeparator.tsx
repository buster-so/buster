import React, { useMemo } from 'react';
import type { IColumnLabelFormat } from '@/api/asset_interfaces/metric/charts/columnLabelInterfaces';
import { Select, type SelectItem } from '@/components/ui/select';
import { LabelAndInput } from '../../../Common/LabelAndInput';

const options: SelectItem[] = [
  {
    label: '100,000',
    value: ','
  },
  {
    label: '100000',
    value: '✂'
  }
];

export const EditSeparator: React.FC<{
  numberSeparatorStyle: IColumnLabelFormat['numberSeparatorStyle'];
  onUpdateColumnConfig: (columnLabelFormat: Partial<IColumnLabelFormat>) => void;
}> = React.memo(({ numberSeparatorStyle, onUpdateColumnConfig }) => {
  const selectedSeparator = useMemo(() => {
    if (numberSeparatorStyle === null) {
      return '✂';
    }

    return options.find((option) => option.value === numberSeparatorStyle)?.value;
  }, [numberSeparatorStyle]);

  return (
    <LabelAndInput label="Separator" dataTestId="edit-separator-input">
      <Select
        items={options}
        value={selectedSeparator}
        onChange={(value: string) =>
          onUpdateColumnConfig({ numberSeparatorStyle: value === '✂' ? null : (value as ',') })
        }
      />
    </LabelAndInput>
  );
});
EditSeparator.displayName = 'EditSeparator';
