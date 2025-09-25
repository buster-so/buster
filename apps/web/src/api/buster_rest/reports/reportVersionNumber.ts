import type { GetReportResponse } from '@buster/server-shared/reports';
import { reportsQueryKeys } from '@/api/query_keys/reports';
import { useGetAssetVersionNumber } from '@/api/response-helpers/common-version-number';

const stableVersionDataSelector = (data: GetReportResponse) => data.version_number;
const stableVersionSearchSelector = (state: { report_version_number?: number | undefined }) =>
  state.report_version_number;

export const useGetReportVersionNumber = (
  reportId: string,
  versionNumber: number | 'LATEST' | undefined
) => {
  return useGetAssetVersionNumber(
    reportsQueryKeys.reportsGetReport(reportId, 'LATEST'),
    versionNumber,
    stableVersionDataSelector,
    stableVersionSearchSelector
  );
};
