import React, { useMemo } from 'react';
import { Select } from 'antd';
import type { IBusterThreadMessageChartConfig } from '@/api/buster_rest';
import { LabelAndInput } from '../../Common';
import last from 'lodash/last';
import { useMemoizedFn } from 'ahooks';
import { isNumericColumnStyle, isNumericColumnType } from '@/utils';
import { ColumnLabelFormat, IColumnLabelFormat } from '@/components/charts';

export const AGGREGATE_OPTIONS: {
  label: string;
  value: IBusterThreadMessageChartConfig['metricValueAggregate'];
}[] = [
  { label: 'Sum', value: 'sum' },
  { label: 'Average', value: 'average' },
  { label: 'Median', value: 'median' },
  { label: 'Count', value: 'count' },
  { label: 'Max', value: 'max' },
  { label: 'Min', value: 'min' },
  { label: 'First', value: 'first' }
];

export const EditMetricAggregate: React.FC<{
  aggregate: IBusterThreadMessageChartConfig['metricValueAggregate'];
  columnId?: string;
  onUpdateAggregate: (aggregate: IBusterThreadMessageChartConfig['metricValueAggregate']) => void;
  columnLabelFormat: ColumnLabelFormat | undefined;
}> = React.memo(({ aggregate, onUpdateAggregate, columnId, columnLabelFormat }) => {
  const isNumberColumn = isNumericColumnType(columnLabelFormat?.columnType!);
  const isNumericStyle = isNumericColumnStyle(columnLabelFormat?.style);
  const disableOptions = !isNumberColumn || !isNumericStyle;

  const selectedOption = useMemo(() => {
    if (!disableOptions) {
      return AGGREGATE_OPTIONS.find((option) => option.value === aggregate)?.value;
    }
    return last(AGGREGATE_OPTIONS)?.value;
  }, [aggregate, disableOptions]);

  const onUpdateMetricValueAggregate = useMemoizedFn((value: string) => {
    onUpdateAggregate(value as IBusterThreadMessageChartConfig['metricValueAggregate']);
  });

  return (
    <LabelAndInput label={'Aggregation'}>
      <Select
        options={AGGREGATE_OPTIONS}
        value={selectedOption}
        onChange={onUpdateMetricValueAggregate}
        disabled={disableOptions}
      />
    </LabelAndInput>
  );
});
EditMetricAggregate.displayName = 'EditMetricAggregate';
