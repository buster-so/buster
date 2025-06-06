'use client';

import { useQueryClient } from '@tanstack/react-query';
import last from 'lodash/last';
import { useMemo } from 'react';
import { useGetMetric } from '@/api/buster_rest/metrics';
import { metricsQueryKeys } from '@/api/query_keys/metric';
import { useMemoizedFn } from '@/hooks';
import { compareObjectsByKeys } from '@/lib/objects';
import { canEdit } from '@/lib/share';
import { useOriginalMetricStore } from './useOriginalMetricStore';

export const useIsMetricChanged = ({ metricId }: { metricId: string | undefined }) => {
  const queryClient = useQueryClient();
  const originalMetric = useOriginalMetricStore((x) => x.getOriginalMetric(metricId));

  const { data: currentMetric, refetch: refetchCurrentMetric } = useGetMetric(
    { id: metricId, versionNumber: undefined },
    {
      select: (x) => ({
        name: x.name,
        description: x.description,
        chart_config: x.chart_config,
        file: x.file,
        version_number: x.version_number,
        versions: x.versions,
        permission: x.permission
      })
    }
  );
  const isLatestVersion = useMemo(() => {
    return currentMetric?.version_number === last(currentMetric?.versions)?.version_number;
  }, [currentMetric]);

  const onResetMetricToOriginal = useMemoizedFn(() => {
    const options = metricsQueryKeys.metricsGetMetric(
      metricId || '',
      originalMetric?.version_number || null
    );
    if (originalMetric) {
      queryClient.setQueryData(options.queryKey, originalMetric);
    }
    refetchCurrentMetric();
  });

  const isEditor = canEdit(currentMetric?.permission);

  const isMetricChanged = useMemo(() => {
    if (!isEditor || !originalMetric || !isLatestVersion || !currentMetric) return false;

    return (
      !currentMetric ||
      !compareObjectsByKeys(originalMetric, currentMetric, [
        'name',
        'description',
        'chart_config',
        'file',
        'version_number'
      ])
    );
  }, [originalMetric, currentMetric, isLatestVersion, isEditor]);

  return {
    onResetMetricToOriginal,
    isMetricChanged
  };
};
