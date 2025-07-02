import { useMemo } from 'react';
import { create } from 'zustand';
import { useMemoizedFn } from '@/hooks';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout';

type MetricQueryStore = {
  latestMetricVersions: Record<string, number>;
  onSetLatestMetricVersion: (metricId: string, versionNumber: number) => void;
};

export const useMetricQueryStore = create<MetricQueryStore>((set) => ({
  latestMetricVersions: {},
  onSetLatestMetricVersion: (metricId: string, versionNumber: number) =>
    set((state) => ({
      latestMetricVersions: {
        ...state.latestMetricVersions,
        [metricId]: versionNumber
      }
    }))
}));

export const useGetMetricVersionNumber = (props?: {
  metricId: string | undefined;
  versionNumber?: number | null;
}): {
  selectedVersionNumber: number | null;
  paramVersionNumber?: number;
  latestVersionNumber: number | null;
} => {
  const { metricId, versionNumber } = props || {};

  const versionNumberQueryParam = useChatLayoutContextSelector((x) => x.metricVersionNumber);
  const metricIdPathParam = useChatLayoutContextSelector((x) => x.metricId);
  const latestVersionNumber = useMetricQueryStore(
    (x) => x.latestMetricVersions[metricId || metricIdPathParam || '']
  );

  const paramVersionNumber = useMemo(() => {
    return versionNumberQueryParam ? versionNumberQueryParam : undefined;
  }, [versionNumberQueryParam]);

  const effectiveVersionNumber = useMemo(() => {
    if (versionNumber === null) return null;
    return versionNumber || paramVersionNumber || latestVersionNumber || null;
  }, [versionNumber, paramVersionNumber, latestVersionNumber]);

  return useMemo(() => {
    return {
      selectedVersionNumber: effectiveVersionNumber,
      paramVersionNumber,
      latestVersionNumber
    };
  }, [effectiveVersionNumber, paramVersionNumber, latestVersionNumber, metricId]);
};

export const useGetLatestMetricVersionMemoized = () => {
  const latestVersionNumber = useMetricQueryStore((x) => x.latestMetricVersions);
  return useMemoizedFn((metricId: string) => latestVersionNumber[metricId]);
};
