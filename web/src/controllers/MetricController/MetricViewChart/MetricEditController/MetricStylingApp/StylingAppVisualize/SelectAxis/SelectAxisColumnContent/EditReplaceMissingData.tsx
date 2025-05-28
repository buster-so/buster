import React, { useMemo } from 'react';
import { LabelAndInput } from '../../../Common';
import { Select, type SelectItem } from '@/components/ui/select';
import type { IColumnLabelFormat } from '@/api/asset_interfaces/metric/charts';

export const MISSING_VALUES_OPTIONS: SelectItem[] = [
  { label: 'Zero', value: '0' },
  { label: 'Do not replace', value: '🧸✂️' }
];

export const EditReplaceMissingData: React.FC<{
  replaceMissingDataWith: IColumnLabelFormat['replaceMissingDataWith'];
  onUpdateColumnConfig: (columnLabelFormat: Partial<IColumnLabelFormat>) => void;
}> = React.memo(({ replaceMissingDataWith, onUpdateColumnConfig }) => {
  const selectedValue = useMemo(() => {
    if (replaceMissingDataWith === null) return '🧸✂️';
    return 0;
  }, [replaceMissingDataWith]);

  return (
    <LabelAndInput label="Missing values">
      <Select
        items={MISSING_VALUES_OPTIONS}
        value={selectedValue || '0'}
        onChange={(v) => {
          let value: IColumnLabelFormat['replaceMissingDataWith'];
          if (v === '🧸✂️') value = null;
          else value = 0;
          onUpdateColumnConfig({ replaceMissingDataWith: value });
        }}
      />
    </LabelAndInput>
  );
});

EditReplaceMissingData.displayName = 'EditReplaceMissingData';
