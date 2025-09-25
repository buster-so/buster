import last from 'lodash/last';
import { useMemo } from 'react';
import { useGetMetric } from '@/api/buster_rest/metrics';
import { canEdit } from '@/lib/share';
import type { BusterMetric } from '../../api/asset_interfaces/metric';
import { useChatIsVersionHistoryMode } from '../Chats/useIsVersionHistoryMode';
import { useGetMetricParams } from './useGetMetricParams';

const stableMetricSelect = (x: BusterMetric) => {
  return {
    permission: x?.permission,
    versions: x?.versions,
    version_number: x?.version_number,
  };
};

export const useIsMetricReadOnly = ({
  metricId,
  readOnly,
}: {
  metricId: string;
  readOnly?: boolean;
}) => {
  const isVersionHistoryMode = useChatIsVersionHistoryMode({ type: 'metric_file' });
  const { metricVersionNumber } = useGetMetricParams();
  const {
    data: metricData,
    isFetched,
    isError,
  } = useGetMetric({ id: metricId, versionNumber: 'LATEST' }, { select: stableMetricSelect });

  const isViewingOldVersion = checkIfMetricIsViewingOldVersion(metricVersionNumber, metricData);

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
    isViewingOldVersion,
  ]);

  return {
    isFetched,
    isError,
    isVersionHistoryMode,
    isReadOnly,
    isViewingOldVersion,
  };
};

const checkIfMetricIsViewingOldVersion = (
  metricVersionNumber: number | undefined,
  metricData: Pick<BusterMetric, 'versions' | 'version_number'> | undefined
) => {
  if (!metricVersionNumber) return false;
  if (metricVersionNumber !== last(metricData?.versions)?.version_number) return true;
  return false;
};
