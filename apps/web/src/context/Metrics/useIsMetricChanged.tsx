import { useQueryClient } from '@tanstack/react-query';
import last from 'lodash/last';
import { useMemo } from 'react';
import { useGetMetric } from '@/api/buster_rest/metrics';
import { metricsQueryKeys } from '@/api/query_keys/metric';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { compareObjectsByKeys } from '@/lib/objects';
import { canEdit } from '@/lib/share';
import { useGetOriginalMetric } from './useOriginalMetricStore';

export const useIsMetricChanged = ({
  metricId,
  enabled = true,
  cacheId,
}: {
  metricId: string | undefined;
  enabled?: boolean;
  cacheId?: string;
}) => {
  const queryClient = useQueryClient();
  const originalMetric = useGetOriginalMetric(metricId);

  const { data: currentMetric, refetch: refetchCurrentMetric } = useGetMetric(
    { id: metricId, cacheId, versionNumber: undefined },
    {
      enabled: false,
      select: (x) => ({
        name: x.name,
        description: x.description,
        chart_config: x.chart_config,
        file: x.file,
        version_number: x.version_number,
        versions: x.versions,
        permission: x.permission,
      }),
    }
  );
  const isLatestVersion =
    currentMetric?.version_number === last(currentMetric?.versions)?.version_number;

  const onResetToOriginal = useMemoizedFn(() => {
    const options = metricsQueryKeys.metricsGetMetric(metricId || '', 'LATEST');
    if (originalMetric) {
      queryClient.setQueryData(options.queryKey, originalMetric);
    }
    refetchCurrentMetric();
  });

  const isEditor = canEdit(currentMetric?.permission);

  const isFileChanged = useMemo(() => {
    if (!isEditor || !originalMetric || !isLatestVersion || !currentMetric || !enabled)
      return false;

    return (
      !currentMetric ||
      !compareObjectsByKeys(originalMetric, currentMetric, [
        'name',
        'description',
        'chart_config',
        'file',
        'version_number',
      ])
    );
  }, [originalMetric, currentMetric, isLatestVersion, isEditor, enabled]);

  return {
    onResetToOriginal,
    isFileChanged,
  };
};
