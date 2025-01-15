import type { IBusterThreadMessageChartConfig } from '@/api/buster-rest/threads/threadConfigInterfaces';
import React, { useMemo } from 'react';
import { LabelAndInput } from '../Common';
import { Input, Select } from 'antd';

export const EditPieInnerLabel = React.memo(
  ({
    pieInnerLabelAggregate,
    pieInnerLabelTitle,
    onUpdateChartConfig
  }: {
    pieInnerLabelAggregate: IBusterThreadMessageChartConfig['pieInnerLabelAggregate'];
    pieInnerLabelTitle: IBusterThreadMessageChartConfig['pieInnerLabelTitle'];
    onUpdateChartConfig: (config: Partial<IBusterThreadMessageChartConfig>) => void;
  }) => {
    return (
      <>
        <EditPieInnerLabelAggregate
          pieInnerLabelAggregate={pieInnerLabelAggregate}
          onUpdateChartConfig={onUpdateChartConfig}
        />

        <EditPieInnerLabelTitle
          pieInnerLabelTitle={pieInnerLabelTitle}
          onUpdateChartConfig={onUpdateChartConfig}
        />
      </>
    );
  }
);
EditPieInnerLabel.displayName = 'EditPieInnerLabel';

const options: {
  label: string;
  value: IBusterThreadMessageChartConfig['pieInnerLabelAggregate'];
}[] = [
  { label: 'Sum', value: 'sum' },
  { label: 'Average', value: 'average' },
  { label: 'Median', value: 'median' },
  { label: 'Max', value: 'max' },
  { label: 'Min', value: 'min' },
  { label: 'Count', value: 'count' }
];

const EditPieInnerLabelAggregate: React.FC<{
  pieInnerLabelAggregate: IBusterThreadMessageChartConfig['pieInnerLabelAggregate'];
  onUpdateChartConfig: (config: Partial<IBusterThreadMessageChartConfig>) => void;
}> = ({ pieInnerLabelAggregate, onUpdateChartConfig }) => {
  const selectedOption = useMemo(() => {
    return options.find((option) => option.value === pieInnerLabelAggregate) || options[0];
  }, [pieInnerLabelAggregate]);

  return (
    <LabelAndInput label="Aggregation">
      <Select
        options={options}
        defaultValue={selectedOption.value}
        onChange={(value) => {
          const label = options.find((option) => option.value === value)?.label;
          onUpdateChartConfig({
            pieInnerLabelAggregate:
              value as IBusterThreadMessageChartConfig['pieInnerLabelAggregate'],
            pieInnerLabelTitle: label
          });
        }}
      />
    </LabelAndInput>
  );
};

const EditPieInnerLabelTitle: React.FC<{
  pieInnerLabelTitle: IBusterThreadMessageChartConfig['pieInnerLabelTitle'];
  onUpdateChartConfig: (config: Partial<IBusterThreadMessageChartConfig>) => void;
}> = ({ pieInnerLabelTitle, onUpdateChartConfig }) => {
  return (
    <LabelAndInput label="Title">
      <Input
        value={pieInnerLabelTitle || ''}
        onChange={(e) => onUpdateChartConfig({ pieInnerLabelTitle: e.target.value })}
      />
    </LabelAndInput>
  );
};
