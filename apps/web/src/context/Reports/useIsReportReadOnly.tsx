import last from 'lodash/last';
import { useMemo } from 'react';
import { useGetReport } from '@/api/buster_rest/reports';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout';
import { canEdit } from '@/lib/share';

export const useIsReportReadOnly = ({
  reportId,
  readOnly
}: {
  reportId: string;
  readOnly?: boolean;
}) => {
  const isVersionHistoryMode = useChatLayoutContextSelector((x) => x.isVersionHistoryMode);
  const reportVersionNumber = useChatLayoutContextSelector((x) => x.reportVersionNumber);
  const {
    data: reportData,
    isFetched,
    isError
  } = useGetReport(
    { reportId, versionNumber: reportVersionNumber },
    {
      select: (x) => ({
        permission: x.permission,
        versions: x.versions,
        version_number: x.version_number
      })
    }
  );

  const isViewingOldVersion = useMemo(() => {
    if (!reportVersionNumber) return false;
    if (reportVersionNumber !== last(reportData?.versions)?.version_number) return true;
    return false;
  }, [reportVersionNumber, reportData]);

  const isReadOnly = useMemo(() => {
    if (readOnly) return true;
    if (isError) return true;
    if (!isFetched) return true;
    if (!canEdit(reportData?.permission)) return true;
    if (isVersionHistoryMode) return true;
    if (isViewingOldVersion) return true;
    return false;
  }, [
    isError,
    isFetched,
    reportData,
    reportVersionNumber,
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
