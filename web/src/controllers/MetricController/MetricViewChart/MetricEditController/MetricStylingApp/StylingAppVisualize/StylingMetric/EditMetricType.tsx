import React, { useMemo } from 'react';
import { Select } from '@/components/ui/select';
import type { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import { LabelAndInput } from '../../Common';
import last from 'lodash/last';
import { useMemoizedFn } from '@/hooks';
import { isNumericColumnStyle, isNumericColumnType } from '@/lib';
import type { ColumnLabelFormat } from '@/api/asset_interfaces/metric/charts';
import type { SelectItem } from '@/components/ui/select';

export const AGGREGATE_OPTIONS: SelectItem<IBusterMetricChartConfig['metricValueAggregate']>[] = [
  { label: 'Sum', value: 'sum' },
  { label: 'Average', value: 'average' },
  { label: 'Median', value: 'median' },
  { label: 'Count', value: 'count' },
  { label: 'Max', value: 'max' },
  { label: 'Min', value: 'min' },
  { label: 'First', value: 'first' }
];

export const EditMetricAggregate: React.FC<{
  aggregate: IBusterMetricChartConfig['metricValueAggregate'];
  columnId?: string;
  onUpdateAggregate: (aggregate: IBusterMetricChartConfig['metricValueAggregate']) => void;
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
    onUpdateAggregate(value as IBusterMetricChartConfig['metricValueAggregate']);
  });

  return (
    <LabelAndInput label={'Aggregation'}>
      <Select
        dataTestId="edit-metric-aggregate"
        items={AGGREGATE_OPTIONS}
        value={selectedOption}
        onChange={onUpdateMetricValueAggregate}
        disabled={disableOptions}
      />
    </LabelAndInput>
  );
});
EditMetricAggregate.displayName = 'EditMetricAggregate';
