import { mainApiV2 } from '../instances';
import { serverFetch } from '@/api/createServerInstance';
import { BASE_URL_V2 } from '../config';
import type {
  GetReportsListRequest,
  GetReportsListResponse,
  GetReportIndividualResponse,
  UpdateReportRequest,
  UpdateReportResponse
} from '@buster/server-shared/reports';

/**
 * Get a list of reports with optional filters
 */
export const getReportsList = async (params?: GetReportsListRequest) => {
  const { page = 1, page_size = 5000, ...allParams } = params || {};
  return mainApiV2
    .get<GetReportsListResponse>('/reports', { params: { page, page_size, ...allParams } })
    .then((res) => res.data);
};

/**
 * Server-side version of getReportsList
 */
export const getReportsList_server = async (params?: Parameters<typeof getReportsList>[0]) => {
  const { page = 1, page_size = 5000, ...allParams } = params || {};
  return await serverFetch<GetReportsListResponse>('/reports', {
    baseURL: BASE_URL_V2,
    params: { page, page_size, ...allParams }
  });
};

/**
 * Get an individual report by ID
 */
export const getReportById = async (reportId: string) => {
  return mainApiV2.get<GetReportIndividualResponse>(`/reports/${reportId}`).then((res) => res.data);
};

/**
 * Server-side version of getReportById
 */
export const getReportById_server = async (reportId: string) => {
  return await serverFetch<GetReportIndividualResponse>(`/reports/${reportId}`, {
    baseURL: BASE_URL_V2,
    method: 'GET'
  });
};

/**
 * Update a report
 */
export const updateReport = async ({
  reportId,
  ...data
}: UpdateReportRequest & { reportId: string }) => {
  return mainApiV2.put<UpdateReportResponse>(`/reports/${reportId}`, data).then((res) => res.data);
};
