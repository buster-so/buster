import type { IBusterThreadMessageChartConfig } from '@/api/buster_rest';
import React, { useMemo, useState } from 'react';
import { LabelAndInput } from '../../../Common/LabelAndInput';
import { Select, SelectProps, Switch } from 'antd';
import { useMemoizedFn } from 'ahooks';

const barGroupingOptions: {
  label: string;
  value: IBusterThreadMessageChartConfig['barGroupType'];
}[] = [
  { label: 'Grouped', value: 'group' },
  { label: 'Stacked', value: 'stack' }
];

const lineGroupingOptions: {
  label: string;
  value: IBusterThreadMessageChartConfig['lineGroupType'] | 'default';
}[] = [
  { label: 'Default', value: 'default' },
  { label: 'Stacked', value: 'stack' }
];

export const EditGrouping: React.FC<{
  selectedChartType: IBusterThreadMessageChartConfig['selectedChartType'];
  onUpdateChartConfig: (value: Partial<IBusterThreadMessageChartConfig>) => void;
  lineGroupType: IBusterThreadMessageChartConfig['lineGroupType'];
  barGroupType: IBusterThreadMessageChartConfig['barGroupType'];
  barShowTotalAtTop: IBusterThreadMessageChartConfig['barShowTotalAtTop'];
}> = React.memo(
  ({ selectedChartType, onUpdateChartConfig, lineGroupType, barGroupType, barShowTotalAtTop }) => {
    const isBarChart = selectedChartType === 'bar';
    const [usePercentageStack, setUsePercentageStack] = useState(
      isBarChart ? barGroupType === 'stack' : lineGroupType === 'stack'
    );
    const [value, setValue] = useState<
      | IBusterThreadMessageChartConfig['lineGroupType']
      | 'default'
      | IBusterThreadMessageChartConfig['barGroupType']
    >(isBarChart ? barGroupType : lineGroupType);

    const showTotal = useMemo(() => {
      return isBarChart && (value === 'stack' || value === 'percentage-stack');
    }, [isBarChart, value]);

    const options = useMemo(() => {
      if (selectedChartType === 'bar') {
        return barGroupingOptions;
      }
      return lineGroupingOptions;
    }, [selectedChartType]);

    const defaultSelectedValue = useMemo(() => {
      if (selectedChartType === 'bar') {
        return barGroupType === 'percentage-stack' || barGroupType === 'stack' ? 'stack' : 'group';
      }
      return lineGroupType === 'stack' || lineGroupType === 'percentage-stack'
        ? 'stack'
        : 'default';
    }, [selectedChartType, lineGroupType]);

    const onChangeStackTotals = useMemoizedFn((value: boolean) => {
      setUsePercentageStack(value);
      if (isBarChart) onUpdateChartConfig({ barShowTotalAtTop: value });
    });

    const onChangeGroupType = useMemoizedFn(
      (
        value:
          | IBusterThreadMessageChartConfig['lineGroupType']
          | IBusterThreadMessageChartConfig['barGroupType']
      ) => {
        if (selectedChartType === 'bar') {
          const barGroupType = value as IBusterThreadMessageChartConfig['barGroupType'];
          onUpdateChartConfig({ barGroupType });
        } else {
          const lineGroupType = value as IBusterThreadMessageChartConfig['lineGroupType'];
          onUpdateChartConfig({ lineGroupType });
        }
      }
    );

    const onChangeGrouping = (value: { value: string }) => {
      setValue(value.value as IBusterThreadMessageChartConfig['barGroupType']);
      onChangeGroupType(value.value as IBusterThreadMessageChartConfig['barGroupType']);
    };

    return (
      <>
        <LabelAndInput label="Stacking">
          <Select
            options={options as SelectProps['options']}
            labelInValue
            defaultValue={defaultSelectedValue as any}
            onChange={onChangeGrouping}
          />
        </LabelAndInput>
        {showTotal && <StackTotals value={barShowTotalAtTop} onChange={onChangeStackTotals} />}
      </>
    );
  }
);
EditGrouping.displayName = 'EditGrouping';

const StackTotals: React.FC<{
  value: boolean;
  onChange: (value: boolean) => void;
}> = React.memo(({ value, onChange }) => {
  return (
    <LabelAndInput label="Stack totals">
      <div className="flex justify-end">
        <Switch defaultChecked={value} onChange={onChange} />
      </div>
    </LabelAndInput>
  );
});
StackTotals.displayName = 'StackTotals';
