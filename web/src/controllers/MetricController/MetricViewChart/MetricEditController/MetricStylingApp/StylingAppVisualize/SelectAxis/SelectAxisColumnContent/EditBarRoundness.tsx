import type { ColumnSettings } from '@/api/asset_interfaces/metric/charts';
import { InputNumber } from '@/components/ui/inputs';
import { Slider, SliderWithInputNumber } from '@/components/ui/slider';
import { useMemoizedFn } from '@/hooks';
import React, { useState } from 'react';
import { LabelAndInput } from '../../../Common/LabelAndInput';

const BAR_ROUNDNESS_MIN = 0;
const BAR_ROUNDNESS_MAX = 50;

export const EditBarRoundness: React.FC<{
  barRoundness: Required<ColumnSettings>['barRoundness'];
  onUpdateColumnSettingConfig: (columnSettings: Partial<ColumnSettings>) => void;
}> = React.memo(({ barRoundness, onUpdateColumnSettingConfig }) => {
  const [value, setValue] = useState<number>(barRoundness);

  const onUpdateBarRoundness = useMemoizedFn((v: number | null) => {
    onUpdateColumnSettingConfig({
      barRoundness: v as Required<ColumnSettings>['barRoundness']
    });
    setValue(v || 0);
  });

  return (
    <LabelAndInput label="Bar roundness">
      <SliderWithInputNumber
        min={BAR_ROUNDNESS_MIN}
        max={BAR_ROUNDNESS_MAX}
        value={value}
        onChange={onUpdateBarRoundness}
      />
    </LabelAndInput>
  );
});
EditBarRoundness.displayName = 'EditBarRoundness';
