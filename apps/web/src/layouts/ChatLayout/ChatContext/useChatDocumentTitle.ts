import type { SelectedFile } from '../interfaces';
import { useGetMetric } from '@/api/buster_rest/metrics';
import { useDocumentTitle } from '@/hooks';
import { useGetDashboard } from '@/api/buster_rest/dashboards';
import { useGetCollection } from '@/api/buster_rest/collections';
import { useMemo } from 'react';

export const useChatDocumentTitle = ({
  chatTitle,
  selectedFileType,
  selectedFileId
}: {
  chatTitle: string | undefined;
  selectedFileId: SelectedFile['id'] | undefined;
  selectedFileType: SelectedFile['type'] | undefined;
}) => {
  const isDashboard = selectedFileType === 'dashboard';
  const isMetric = selectedFileType === 'metric';

  const { data: dashboardTitle } = useGetDashboard(
    { id: isDashboard ? selectedFileId : undefined },
    { select: (x) => x.dashboard.name }
  );
  const { data: metricTitle } = useGetMetric(
    { id: isMetric ? selectedFileId : undefined },
    { select: (x) => x.name }
  );

  const title = useMemo(() => {
    const fileTitle = dashboardTitle || metricTitle;
    return [fileTitle, chatTitle].filter(Boolean).join(' | ');
  }, [chatTitle, dashboardTitle, metricTitle]);

  useDocumentTitle(title);
};
