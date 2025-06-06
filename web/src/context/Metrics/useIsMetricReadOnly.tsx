import last from 'lodash/last';
import { useMemo } from 'react';
import { useGetMetric } from '@/api/buster_rest/metrics';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout';
import { canEdit } from '@/lib/share';

export const useIsMetricReadOnly = ({
  metricId,
  readOnly
}: {
  metricId: string;
  readOnly?: boolean;
}) => {
  const isVersionHistoryMode = useChatLayoutContextSelector((x) => x.isVersionHistoryMode);
  const metricVersionNumber = useChatLayoutContextSelector((x) => x.metricVersionNumber);
  const {
    data: metricData,
    isFetched,
    isError
  } = useGetMetric(
    { id: metricId },
    {
      select: (x) => ({
        permission: x.permission,
        versions: x.versions,
        version_number: x.version_number
      })
    }
  );

  const isViewingOldVersion = useMemo(() => {
    if (!metricVersionNumber) return false;
    if (metricVersionNumber !== last(metricData?.versions)?.version_number) return true;
    return false;
  }, [metricVersionNumber, metricData]);

  const isReadOnly = useMemo(() => {
    if (readOnly) return true;
    if (isError) return true;
    if (!isFetched) return true;
    if (!canEdit(metricData?.permission)) return true;
    if (isVersionHistoryMode) return true;
    if (isViewingOldVersion) return true;
    return false;
  }, [
    isError,
    isFetched,
    metricData,
    metricVersionNumber,
    isVersionHistoryMode,
    isViewingOldVersion
  ]);

  return {
    isFetched,
    isError,
    isVersionHistoryMode,
    isReadOnly,
    isViewingOldVersion
  };
};
