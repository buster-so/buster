import type { QueryClient } from '@tanstack/react-query';
import last from 'lodash/last';
import { reportsQueryKeys } from '@/api/query_keys/reports';
import { initializeMetrics } from '../metrics/metricQueryHelpers';
import { getReportById } from './requests';

export const getReportAndInitializeMetrics = async ({
  id,
  version_number,
  password,
  queryClient,
  shouldInitializeMetrics = true,
  prefetchMetricsData = false,
}: {
  id: string;
  version_number: number | 'LATEST' | undefined;
  password: string | undefined;
  queryClient: QueryClient;
  shouldInitializeMetrics: boolean;
  prefetchMetricsData: boolean;
}) => {
  const chosenVersionNumber = version_number === 'LATEST' ? undefined : version_number;
  return getReportById({
    id,
    version_number: chosenVersionNumber,
    password,
  }).then((data) => {
    const latestVersion = last(data.versions)?.version_number || 1;
    const isLatestVersion = data.version_number === latestVersion;

    if (isLatestVersion && version_number !== 'LATEST') {
      queryClient.setQueryData(reportsQueryKeys.reportsGetReport(data.id, 'LATEST').queryKey, data);
    }

    if (data.version_number) {
      queryClient.setQueryData(
        reportsQueryKeys.reportsGetReport(data.id, data.version_number).queryKey,
        data
      );
    }

    if (shouldInitializeMetrics || prefetchMetricsData) {
      initializeMetrics(data.metrics, queryClient, !!prefetchMetricsData);
    }

    return data;
  });
};
