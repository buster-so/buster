import type { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import React, { useMemo } from 'react';
import { LabelAndInput } from '../Common';
import type { BarSortBy } from '@/api/asset_interfaces/metric/charts';
import { AppSegmented, type SegmentedItem } from '@/components/ui/segmented';
import {
  ChartBarAxisX,
  ChartBarTrendDown,
  ChartBarTrendUp
} from '@/components/ui/icons/NucleoIconFilled';
import { BarChartSortAscIcon } from '@/components/ui/icons/customIcons/BarChartSortAscIcon';
import { BarChartSortNoneIcon } from '@/components/ui/icons/customIcons/BarChart_NoSort';
import { BarChartSortDescIcon } from '@/components/ui/icons/customIcons/BarChartSortDescIcon';
import { useMemoizedFn } from '@/hooks';

const options: SegmentedItem<BarSortBy[0]>[] = [
  {
    value: 'none',
    tooltip: 'No sorting',
    icon: <BarChartSortNoneIcon />
  },
  {
    icon: <BarChartSortAscIcon />,
    value: 'asc',
    tooltip: 'Sort ascending'
  },
  {
    icon: <BarChartSortDescIcon />,
    value: 'desc',
    tooltip: 'Sort descending'
  }
];

export const EditBarSorting: React.FC<{
  barSortBy: IBusterMetricChartConfig['barSortBy'];
  onUpdateChartConfig: (v: Partial<IBusterMetricChartConfig>) => void;
}> = React.memo(({ barSortBy, onUpdateChartConfig }) => {
  const selectedOption = useMemo(() => {
    return (
      options.find((option) => {
        return barSortBy.includes(option.value);
      })?.value || 'none'
    );
  }, [barSortBy]);

  const onChange = useMemoizedFn((value: SegmentedItem<'none' | 'asc' | 'desc'>) => {
    onUpdateChartConfig({ barSortBy: [value.value] });
  });

  return (
    <LabelAndInput label="Sorting">
      <div className="flex justify-end">
        <AppSegmented options={options} value={selectedOption} onChange={onChange} type="button" />
      </div>
    </LabelAndInput>
  );
});
EditBarSorting.displayName = 'EditBarSorting';
