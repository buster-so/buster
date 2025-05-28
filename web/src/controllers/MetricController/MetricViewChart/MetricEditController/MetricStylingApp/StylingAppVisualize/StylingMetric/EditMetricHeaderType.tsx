import type { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import { Select, type SelectItem } from '@/components/ui/select';
import { useMemoizedFn } from '@/hooks';
import React, { useMemo } from 'react';
import { LabelAndInput } from '../../Common';

const allOptions: SelectItem<'custom' | 'columnTitle' | 'columnValue' | 'none'>[] = [
  {
    label: 'None',
    value: 'none'
  },
  {
    label: 'Custom',
    value: 'custom'
  },
  {
    label: 'Column title',
    value: 'columnTitle'
  },
  {
    label: 'Column value',
    value: 'columnValue'
  }
];

const onlyCustomOptions = [allOptions[0], allOptions[1]];

export const EditMetricHeader: React.FC<{
  header: IBusterMetricChartConfig['metricHeader'] | IBusterMetricChartConfig['metricSubHeader'];
  type: 'header' | 'subHeader';
  firstColumnId: string;
  hideDerivedMetricOption: boolean;
  onUpdateChartConfig: (chartConfig: Partial<IBusterMetricChartConfig>) => void;
}> = React.memo(({ header, type, firstColumnId, hideDerivedMetricOption, onUpdateChartConfig }) => {
  const selectedOption = useMemo(() => {
    if (header === null) return 'none';
    if (typeof header === 'string') return 'custom';
    return header?.useValue ? 'columnValue' : 'columnTitle';
  }, [header]);

  const options = useMemo(() => {
    if (hideDerivedMetricOption) return onlyCustomOptions;
    return allOptions;
  }, [hideDerivedMetricOption]);

  const title = useMemo(() => (type === 'header' ? 'Header type' : 'Sub-header type'), [type]);

  const onUpdateMetricHeader = useMemoizedFn(
    (option: 'custom' | 'columnTitle' | 'columnValue' | 'none') => {
      const key = type === 'header' ? 'metricHeader' : 'metricSubHeader';
      const existingColumnId = typeof header === 'object' && header?.columnId;

      if (option === 'custom') {
        return onUpdateChartConfig({
          [key]: ''
        });
      }

      if (option === 'columnTitle') {
        return onUpdateChartConfig({
          [key]: {
            columnId: existingColumnId || firstColumnId,
            useValue: false
          }
        });
      }

      if (option === 'columnValue') {
        return onUpdateChartConfig({
          [key]: {
            columnId: existingColumnId || firstColumnId,
            useValue: true
          }
        });
      }

      onUpdateChartConfig({
        [key]: null
      });
    }
  );

  return (
    <LabelAndInput label={title}>
      <Select
        dataTestId={type === 'header' ? 'edit-metric-header-type' : 'edit-metric-subheader-type'}
        items={options}
        value={selectedOption}
        onChange={onUpdateMetricHeader}
      />
    </LabelAndInput>
  );
});
EditMetricHeader.displayName = 'EditMetricHeader';
