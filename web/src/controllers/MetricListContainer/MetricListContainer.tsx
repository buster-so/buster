'use client';

import React, { useMemo, useState } from 'react';
import type { VerificationStatus } from '@/api/asset_interfaces';
import { useGetMetricsList } from '@/api/buster_rest/metrics';
import { AppPageLayout } from '@/components/ui/layouts';
import { MetricItemsContainer } from './MetricItemsContainer';
import { MetricListHeader } from './MetricListHeader';

export const MetricListContainer: React.FC = React.memo(() => {
  const [filters, setFilters] = useState<VerificationStatus[]>([]);
  const { data: metricList, isFetched } = useGetMetricsList({ status: filters });

  return (
    <AppPageLayout
      headerSizeVariant="list"
      header={useMemo(
        () => <MetricListHeader filters={filters} onSetFilters={setFilters} />,
        [filters]
      )}>
      <MetricItemsContainer
        metrics={metricList}
        loading={!isFetched}
        className="flex-col overflow-hidden"
      />
    </AppPageLayout>
  );
});

MetricListContainer.displayName = 'MetricListContainer';
