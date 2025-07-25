import first from 'lodash/first';
import React, { useMemo } from 'react';
import type { ChartConfigProps } from '@buster/server-shared/metrics';
import { Select, type SelectItem } from '@/components/ui/select';
import { useMemoizedFn } from '@/hooks';
import { LabelAndInput } from '../Common';

const options: SelectItem<ChartConfigProps['showLegendHeadline'] | 'false'>[] = [
  { label: 'None', value: 'false' },
  { label: 'Total', value: 'total' },
  { label: 'Average', value: 'average' },
  { label: 'Median', value: 'median' },
  { label: 'Max', value: 'max' },
  { label: 'Min', value: 'min' },
  { label: 'Current', value: 'current' }
];

const pieOptions: SelectItem<'false' | 'current'>[] = [
  { label: 'None', value: 'false' },
  { label: 'Current', value: 'current' }
];

export const EditShowHeadline: React.FC<{
  showLegendHeadline: ChartConfigProps['showLegendHeadline'];
  onUpdateChartConfig: (config: Partial<ChartConfigProps>) => void;
  lineGroupType: ChartConfigProps['lineGroupType'];
  barGroupType: ChartConfigProps['barGroupType'];
  selectedChartType: ChartConfigProps['selectedChartType'];
}> = React.memo(
  ({ showLegendHeadline, onUpdateChartConfig, lineGroupType, barGroupType, selectedChartType }) => {
    const isStackPercentage =
      (lineGroupType === 'percentage-stack' && selectedChartType === 'line') ||
      (barGroupType === 'percentage-stack' && selectedChartType === 'bar');

    const allOptions: SelectItem[] = useMemo(() => {
      if (selectedChartType === 'pie') {
        return pieOptions;
      }
      return options as SelectItem[];
    }, [selectedChartType]);

    const selectedHeadline = useMemo(() => {
      if (selectedChartType === 'pie' && showLegendHeadline !== false) {
        return 'current';
      }
      if (!showLegendHeadline) return first(options)?.value;

      return (
        allOptions.find((option) => option.value === showLegendHeadline)?.value ||
        first(allOptions)?.value
      );
    }, [showLegendHeadline, allOptions]);

    const onChange = useMemoizedFn((value: string | false) => {
      const transformedValue = value === 'false' ? false : value;

      onUpdateChartConfig({
        showLegend: true,
        showLegendHeadline: transformedValue as ChartConfigProps['showLegendHeadline']
      });
    });

    if (isStackPercentage) {
      return null;
    }

    return (
      <LabelAndInput label="Legend headline">
        <Select
          disabled={isStackPercentage}
          items={allOptions}
          value={selectedHeadline || 'false'}
          onChange={onChange}
        />
      </LabelAndInput>
    );
  }
);
EditShowHeadline.displayName = 'EditShowHeadline';
