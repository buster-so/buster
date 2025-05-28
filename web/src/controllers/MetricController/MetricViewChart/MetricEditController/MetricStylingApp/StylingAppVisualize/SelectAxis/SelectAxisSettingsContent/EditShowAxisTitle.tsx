import type { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import { Input } from '@/components/ui/inputs';
import { Switch } from '@/components/ui/switch';
import { useMemoizedFn } from '@/hooks';
import React, { useState } from 'react';
import { LabelAndInput } from '../../../Common/LabelAndInput';

export const EditShowAxisTitle: React.FC<{
  axisTitle:
    | IBusterMetricChartConfig['xAxisAxisTitle']
    | IBusterMetricChartConfig['yAxisAxisTitle'];
  showAxisTitle: boolean;
  formattedColumnTitle: string;
  onChangeAxisTitle: (value: string | null) => void;
  onChangeShowAxisTitle: (value: boolean) => void;
}> = React.memo(
  ({
    axisTitle,
    showAxisTitle,
    formattedColumnTitle,
    onChangeAxisTitle,
    onChangeShowAxisTitle
  }) => {
    const [show, setShow] = useState(showAxisTitle);

    const onToggleAxisTitle = useMemoizedFn((show: boolean) => {
      setShow(show);
      onChangeShowAxisTitle(show);

      if (!axisTitle && axisTitle !== null && show) {
        onChangeAxisTitle(null);
      }
    });

    return (
      <>
        <EditToggleAxisTitle onToggleAxisTitle={onToggleAxisTitle} useAxisTitleInput={show} />
        {show && (
          <EditAxisTitle
            formattedColumnTitle={formattedColumnTitle}
            axisTitle={axisTitle}
            onChangeTitle={onChangeAxisTitle}
          />
        )}
      </>
    );
  }
);
EditShowAxisTitle.displayName = 'EditShowAxisTitle';

const EditToggleAxisTitle: React.FC<{
  onToggleAxisTitle: (show: boolean) => void;
  useAxisTitleInput: boolean;
}> = ({ useAxisTitleInput, onToggleAxisTitle }) => {
  return (
    <LabelAndInput label="Show axis title">
      <div className="flex justify-end">
        <Switch checked={useAxisTitleInput} onCheckedChange={onToggleAxisTitle} />
      </div>
    </LabelAndInput>
  );
};

export const EditAxisTitle: React.FC<{
  label?: string;
  axisTitle:
    | IBusterMetricChartConfig['xAxisAxisTitle']
    | IBusterMetricChartConfig['yAxisAxisTitle']
    | IBusterMetricChartConfig['categoryAxisTitle'];
  onChangeTitle: (v: string | null) => void;
  formattedColumnTitle: string;
}> = ({ axisTitle, onChangeTitle, formattedColumnTitle, label = 'Axis title' }) => {
  return (
    <LabelAndInput label={label}>
      <Input
        placeholder={formattedColumnTitle || 'Column ID'}
        value={axisTitle || ''}
        onChange={(e) => {
          onChangeTitle(e.target.value || null);
        }}
      />
    </LabelAndInput>
  );
};
