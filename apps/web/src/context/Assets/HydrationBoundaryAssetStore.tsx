'use client';

import type { BusterDashboardResponse } from '@/api/asset_interfaces/dashboard';
import type { BusterMetric } from '@/api/asset_interfaces/metric';
import { HydrationBoundaryDashboardStore } from '../Dashboards/useOriginalDashboardStore';
import { HydrationBoundaryMetricStore } from '../Metrics/useOriginalMetricStore';

export const HydrationBoundaryAssetStore: React.FC<{
  children: React.ReactNode;
  asset: BusterMetric | BusterDashboardResponse | undefined;
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
