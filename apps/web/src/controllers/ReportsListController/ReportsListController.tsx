'use client';

import { useGetReportsList } from '@/api/buster_rest/reports';
import { ReportItemsContainer } from './ReportItemsContainer';

export const ReportsListController: React.FC = () => {
  const { data: list, isFetched } = useGetReportsList();

  return <ReportItemsContainer reports={list?.data || []} loading={!isFetched} />;
};
