'use client';

import { create } from 'zustand';
import type { BusterDashboard } from '@/api/asset_interfaces/dashboard';
import { useMount } from '@/hooks';

type OriginalDashboardStore = {
  originalDashboards: Record<string, BusterDashboard>;
  bulkAddOriginalDashboards: (dashboards: Record<string, BusterDashboard>) => void;
  setOriginalDashboard: (dashboard: BusterDashboard) => void;
  getOriginalDashboard: (dashboardId: string | undefined) => BusterDashboard | undefined;
  removeOriginalDashboard: (dashboardId: string) => void;
};

export const useOriginalDashboardStore = create<OriginalDashboardStore>((set, get) => ({
  originalDashboards: {},
  bulkAddOriginalDashboards: (dashboards: Record<string, BusterDashboard>) =>
    set((prev) => ({
      originalDashboards: {
        ...prev.originalDashboards,
        ...dashboards
      }
    })),
  setOriginalDashboard: (dashboard: BusterDashboard) =>
    set((state) => ({
      originalDashboards: {
        ...state.originalDashboards,
        [dashboard.id]: dashboard
      }
    })),
  getOriginalDashboard: (dashboardId: string | undefined) =>
    dashboardId ? get().originalDashboards[dashboardId] : undefined,
  removeOriginalDashboard: (dashboardId: string) =>
    set((state) => {
      const { [dashboardId]: removed, ...rest } = state.originalDashboards;
      return { originalDashboards: rest };
    })
}));

export const HydrationBoundaryDashboardStore: React.FC<{
  children: React.ReactNode;
  dashboard?: OriginalDashboardStore['originalDashboards'][string];
}> = ({ children, dashboard }) => {
  const setOriginalDashboards = useOriginalDashboardStore((x) => x.setOriginalDashboard);

  useMount(() => {
    if (dashboard) setOriginalDashboards(dashboard);
  });

  return <>{children}</>;
};
