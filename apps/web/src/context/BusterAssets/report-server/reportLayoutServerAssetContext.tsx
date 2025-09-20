import type { AssetType } from '@buster/server-shared/assets';
import type { QueryClient } from '@tanstack/react-query';
import { Outlet } from '@tanstack/react-router';
import { z } from 'zod';
import { prefetchGetReport } from '@/api/buster_rest/reports';
import { ReportAssetContainer } from '@/layouts/AssetContainer/ReportAssetContainer/ReportAssetContainer';
import { useGetReportParams } from '../../Reports/useGetReportParams';

export const validateSearch = z.object({
  report_version_number: z.coerce.number().optional(),
});

export const beforeLoad = ({ search }: { search: { report_version_number?: number } }) => {
  return {
    report_version_number: search.report_version_number,
  };
};

export const loader = async ({
  params: { reportId },
  context: { queryClient, report_version_number },
}: {
  params: { reportId: string; chatId?: string };
  context: { queryClient: QueryClient; report_version_number?: number };
}): Promise<{ title: string | undefined }> => {
  const data = await prefetchGetReport(queryClient, reportId, report_version_number);
  return {
    title: data?.name,
  };
};

export const staticData = {
  assetType: 'report_file' as AssetType,
};

export const head = ({ loaderData }: { loaderData?: { title: string | undefined } } = {}) => ({
  meta: [
    { title: loaderData?.title || 'Report' },
    { name: 'description', content: 'View detailed report data and analysis' },
    { name: 'og:title', content: 'Report' },
    { name: 'og:description', content: 'View detailed report data and analysis' },
  ],
});

export const component = () => {
  const params = useGetReportParams();
  return (
    <ReportAssetContainer {...params}>
      <Outlet />
    </ReportAssetContainer>
  );
};

export const ssr = false;
