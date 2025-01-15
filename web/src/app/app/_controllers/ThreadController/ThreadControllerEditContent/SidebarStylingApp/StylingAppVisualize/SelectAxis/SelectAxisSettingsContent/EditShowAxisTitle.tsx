import React, { useState } from 'react';
import { LabelAndInput } from '../../../Common/LabelAndInput';
import { IBusterThreadMessageChartConfig } from '@/api/buster-rest';
import { Input, Switch } from 'antd';
import { useMemoizedFn } from 'ahooks';

export const EditShowAxisTitle: React.FC<{
  axisTitle:
    | IBusterThreadMessageChartConfig['xAxisAxisTitle']
    | IBusterThreadMessageChartConfig['yAxisAxisTitle'];
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

      if (!axisTitle && show) {
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
  },
  (prevProps, nextProps) => {
    return prevProps.axisTitle === nextProps.axisTitle;
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
        <Switch checked={useAxisTitleInput} onChange={onToggleAxisTitle} />
      </div>
    </LabelAndInput>
  );
};

export const EditAxisTitle: React.FC<{
  label?: string;
  axisTitle:
    | IBusterThreadMessageChartConfig['xAxisAxisTitle']
    | IBusterThreadMessageChartConfig['yAxisAxisTitle']
    | IBusterThreadMessageChartConfig['categoryAxisTitle'];
  onChangeTitle: (v: string | null) => void;
  formattedColumnTitle: string;
}> = ({ axisTitle, onChangeTitle, formattedColumnTitle, label = 'Axis title' }) => {
  return (
    <LabelAndInput label={label}>
      <Input
        placeholder={formattedColumnTitle || 'Column ID'}
        defaultValue={axisTitle || ''}
        onChange={(e) => {
          onChangeTitle(e.target.value || null);
        }}
      />
    </LabelAndInput>
  );
};
