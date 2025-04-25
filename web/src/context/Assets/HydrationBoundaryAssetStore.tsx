'use client';

import React from 'react';
import { BusterDashboardResponse } from '@/api/asset_interfaces/dashboard';
import { IBusterMetric } from '@/api/asset_interfaces/metric';
import { HydrationBoundaryMetricStore } from '../Metrics/useOriginalMetricStore';
import { HydrationBoundaryDashboardStore } from '../Dashboards/useOriginalDashboardStore';

export const HydrationBoundaryAssetStore: React.FC<{
  children: React.ReactNode;
  asset: IBusterMetric | BusterDashboardResponse | undefined;
}> = ({ children, asset }) => {
  if (!asset) return <>{children}</>;

  if ('chart_config' in asset) {
    return <HydrationBoundaryMetricStore metric={asset}>{children}</HydrationBoundaryMetricStore>;
  }

  if ('dashboard' in asset) {
    return (
      <HydrationBoundaryDashboardStore dashboard={asset.dashboard}>
        {children}
      </HydrationBoundaryDashboardStore>
    );
  }

  return <>{children}</>;
};
