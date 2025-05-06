import React from 'react';
import { LabelAndInput } from '../Common';
import { Switch } from '@/components/ui/switch';

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
