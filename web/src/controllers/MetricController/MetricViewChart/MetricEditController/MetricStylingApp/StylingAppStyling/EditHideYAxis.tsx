import React from 'react';
import { Switch } from '@/components/ui/switch';
import { LabelAndInput } from '../Common';

export const EditHideYAxis: React.FC<{
  hideYAxis: boolean;
  onUpdateYAxis: (v: boolean) => void;
}> = React.memo(({ hideYAxis, onUpdateYAxis }) => {
  return (
    <LabelAndInput label={'Hide y-axis'}>
      <div className="flex justify-end">
        <Switch checked={hideYAxis} onCheckedChange={onUpdateYAxis} />
      </div>
    </LabelAndInput>
  );
});
EditHideYAxis.displayName = 'EditHideYAxis';
