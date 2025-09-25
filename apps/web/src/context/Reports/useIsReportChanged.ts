import type { GetReportResponse } from '@buster/server-shared/reports';
import { useQueryClient } from '@tanstack/react-query';
import last from 'lodash/last';
import { create } from 'mutative';
import { useCallback, useMemo } from 'react';
import { useGetReport } from '@/api/buster_rest/reports';
import { reportsQueryKeys } from '@/api/query_keys/reports';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { compareObjectsByKeys } from '@/lib/objects';
import { canEdit } from '@/lib/share';
import { useGetOriginalReport } from './useOriginalReportStore';

export const useIsReportChanged = ({
  reportId,
  enabled = false,
}: {
  reportId: string | undefined;
  enabled?: boolean;
}) => {
  const queryClient = useQueryClient();
  const originalReport = useGetOriginalReport(reportId);

  const { data: currentReport, refetch: refetchCurrentReport } = useGetReport(
    { id: reportId || '', versionNumber: undefined },
    {
      enabled,
      select: useCallback(
        (x: GetReportResponse) => ({
          name: x.name,
          content: x.content,
          version_number: x.version_number,
          versions: x.versions,
          permission: x.permission,
        }),
        []
      ),
    }
  );

  const isLatestVersion =
    currentReport?.version_number === last(currentReport?.versions)?.version_number;

  const onResetToOriginal = useMemoizedFn(() => {
    const options = reportsQueryKeys.reportsGetReport(reportId || '', 'LATEST');
    const currentReport = queryClient.getQueryData<GetReportResponse>(options.queryKey);
    if (originalReport && currentReport) {
      const resetReport = create(currentReport, (draft) => {
        Object.assign(draft, originalReport);
      });
      queryClient.setQueryData(options.queryKey, resetReport);
    }
    refetchCurrentReport();
  });

  const isEditor = canEdit(currentReport?.permission);

  const isFileChanged = useMemo(() => {
    if (!isEditor || !isLatestVersion || !currentReport || !originalReport || !enabled)
      return false;
    return (
      !originalReport ||
      !currentReport ||
      !compareObjectsByKeys(originalReport, currentReport, ['name', 'content'])
    );
  }, [originalReport, isEditor, currentReport, isLatestVersion, enabled]);

  return useMemo(() => ({ onResetToOriginal, isFileChanged }), [onResetToOriginal, isFileChanged]);
};
