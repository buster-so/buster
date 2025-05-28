'use client';

import React, { useMemo, useState } from 'react';
import type { VerificationStatus } from '@/api/asset_interfaces';
import { MetricListHeader } from './MetricListHeader';
import { MetricItemsContainer } from './MetricItemsContainer';
import { AppPageLayout } from '@/components/ui/layouts';
import { useGetMetricsList } from '@/api/buster_rest/metrics';

export const MetricListContainer: React.FC = React.memo(() => {
  const [filters, setFilters] = useState<VerificationStatus[]>([]);
  const { data: metricList, isFetched } = useGetMetricsList({ status: filters });

  return (
    <AppPageLayout
      headerSizeVariant="list"
      header={useMemo(
        () => (
          <MetricListHeader filters={filters} onSetFilters={setFilters} />
        ),
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
