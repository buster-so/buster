'use client';

import React, { useMemo } from 'react';
import { AppSegmented } from '@/components/ui/segmented';
import { VerificationStatus } from '@/api/asset_interfaces';
import { Text } from '@/components/ui/typography';
import { useMemoizedFn } from '@/hooks';
import type { SegmentedItem } from '@/components/ui/segmented';

export const MetricListHeader: React.FC<{
  filters: VerificationStatus[];
  onSetFilters: (filters: VerificationStatus[]) => void;
}> = React.memo(({ filters, onSetFilters }) => {
  const showFilters: boolean = true;

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center space-x-3">
        <Text>{'Metrics'}</Text>
        {showFilters && <MetricsFilters filters={filters} onSetFilters={onSetFilters} />}
      </div>
    </div>
  );
});
MetricListHeader.displayName = 'MetricListHeader';

const options: SegmentedItem<VerificationStatus | 'all'>[] = [
  {
    label: 'All',
    value: 'all'
  },
  {
    label: 'Requested',
    value: VerificationStatus.REQUESTED
  },
  {
    label: 'Verified',
    value: VerificationStatus.VERIFIED
  }
];

const MetricsFilters: React.FC<{
  filters: VerificationStatus[];
  onSetFilters: (filters: VerificationStatus[]) => void;
}> = React.memo(({ filters, onSetFilters }) => {
  const selectedOption: SegmentedItem<VerificationStatus | 'all'> | undefined = useMemo(() => {
    return (
      options.find((option) => {
        return filters.includes(option.value as VerificationStatus);
      }) || options[0]
    );
  }, [filters]);

  const onChange = useMemoizedFn((v: SegmentedItem<VerificationStatus | 'all'>) => {
    if (v.value === 'all') {
      onSetFilters([]);
    } else {
      onSetFilters([v.value as VerificationStatus]);
    }
  });

  return (
    <AppSegmented
      type="button"
      size="default"
      value={selectedOption?.value}
      options={options}
      onChange={onChange}
    />
  );
});
MetricsFilters.displayName = 'MetricsFilters';
