import { useMemo } from 'react';
import { create } from 'zustand';
import { useMemoizedFn } from '@/hooks';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout';

type DashboardQueryStore = {
  latestDashboardVersions: Record<string, number>;
  onSetLatestDashboardVersion: (dashboardId: string, versionNumber: number) => void;
};

export const useDashboardQueryStore = create<DashboardQueryStore>((set, get) => ({
  latestDashboardVersions: {},
  onSetLatestDashboardVersion: (dashboardId: string, versionNumber: number) =>
    set((state) => ({
      latestDashboardVersions: {
        ...state.latestDashboardVersions,
        [dashboardId]: versionNumber
      }
    }))
}));

export const useGetDashboardVersionNumber = (props?: {
  dashboardId?: string;
  versionNumber?: number | null;
}): {
  selectedVersionNumber: number | null;
  paramVersionNumber?: number;
  latestVersionNumber: number | null;
} => {
  const { dashboardId, versionNumber } = props || {};

  const versionNumberQueryParam = useChatLayoutContextSelector((x) => x.dashboardVersionNumber);
  const dashboardIdPathParam = useChatLayoutContextSelector((x) => x.dashboardId);
  const latestVersionNumber = useDashboardQueryStore(
    (x) => x.latestDashboardVersions[dashboardId || dashboardIdPathParam || '']
  );

  const paramVersionNumber = useMemo(() => {
    return versionNumberQueryParam ? versionNumberQueryParam : undefined;
  }, [versionNumberQueryParam]);

  const effectiveVersionNumber = useMemo(() => {
    if (versionNumber === null) return null;
    return versionNumber || paramVersionNumber || latestVersionNumber || 0;
  }, [versionNumber, paramVersionNumber, latestVersionNumber]);

  return useMemo(() => {
    return {
      selectedVersionNumber: effectiveVersionNumber,
      paramVersionNumber,
      latestVersionNumber
    };
  }, [effectiveVersionNumber, paramVersionNumber, latestVersionNumber]);
};

export const useGetLatestDashboardVersionMemoized = () => {
  const latestVersionNumber = useDashboardQueryStore((x) => x.latestDashboardVersions);
  return useMemoizedFn((dashboardId: string) => latestVersionNumber[dashboardId]);
};
