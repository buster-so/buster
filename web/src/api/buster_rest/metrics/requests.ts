import type {
  BusterChartConfigProps,
  BusterMetric,
  BusterMetricData,
  BusterMetricListItem
} from '@/api/asset_interfaces/metric';
import type { VerificationStatus } from '@/api/asset_interfaces/share';
import type {
  ShareDeleteRequest,
  SharePostRequest,
  ShareUpdateRequest
} from '@/api/asset_interfaces/shared_interfaces';
import { serverFetch } from '@/api/createServerInstance';
import { mainApi } from '../instances';

export const getMetric = async ({
  id,
  password,
  version_number
}: {
  id: string;
  password?: string;
  version_number?: number; //api will default to latest if not provided
}) => {
  return mainApi
    .get<BusterMetric>(`/metrics/${id}`, {
      params: { password, version_number }
    })
    .then((res) => res.data);
};

export const getMetric_server = async ({ id, password }: Parameters<typeof getMetric>[0]) => {
  return await serverFetch<BusterMetric>(`/metrics/${id}`, {
    params: { ...(password && { password }) }
  });
};

export const getMetricData = async ({
  id,
  version_number,
  password
}: {
  id: string;
  version_number?: number;
  password?: string;
}) => {
  return mainApi
    .get<BusterMetricData>(`/metrics/${id}/data`, { params: { password, version_number } })
    .then((res) => res.data);
};

export const listMetrics = async (params: {
  /** The token representing the current page number for pagination */
  page_token: number;
  /** The number of items to return per page */
  page_size: number;
  /** Filtering options for metrics based on verification status */
  status?: VerificationStatus[] | null;
}) => {
  return mainApi.get<BusterMetricListItem[]>('/metrics', { params }).then((res) => res.data);
};

export const listMetrics_server = async (params: Parameters<typeof listMetrics>[0]) => {
  return await serverFetch<BusterMetricListItem[]>('/metrics', { params });
};

export const updateMetric = async (params: {
  /** The unique identifier of the metric to update */
  id: string;
  /** New title for the metric */
  name?: string;
  /** SQL query associated with the metric */
  sql?: string;
  /** chart_config to update */
  chart_config?: BusterChartConfigProps;
  /** file in yaml format to update */
  file?: string;
  /** update the version number of the metric - default is true */
  update_version?: boolean;
  /** restore the metric to a specific version */
  restore_to_version?: number;
}) => {
  return mainApi.put<BusterMetric>(`/metrics/${params.id}`, params).then((res) => res.data);
};

export const deleteMetrics = async (params: { ids: string[] }) => {
  return mainApi
    .delete<null>('/metrics', {
      data: { ids: params.ids }
    })
    .then((res) => res.data);
};

export const duplicateMetric = async (params: {
  id: string;
  message_id: string;
  share_with_same_people: boolean;
}) => {
  return mainApi.post<BusterMetric>('/metrics/duplicate', params).then((res) => res.data);
};

export const bulkUpdateMetricVerificationStatus = async (
  params: {
    id: string;
    status: VerificationStatus;
  }[]
) => {
  return mainApi
    .put<{
      failed_updates: [];
      failure_count: 0;
      success_count: 0;
      total_processed: 0;
      updated_metrics: BusterMetric[];
    }>('/metrics', params)
    .then((res) => res.data);
};

// share metrics

export const shareMetric = async ({ id, params }: { id: string; params: SharePostRequest }) => {
  return mainApi.post<BusterMetric>(`/metrics/${id}/sharing`, params).then((res) => res.data);
};

export const unshareMetric = async ({ id, data }: { id: string; data: ShareDeleteRequest }) => {
  return mainApi.delete<BusterMetric>(`/metrics/${id}/sharing`, { data }).then((res) => res.data);
};

export const updateMetricShare = async ({
  params,
  id
}: {
  id: string;
  params: ShareUpdateRequest;
}) => {
  return mainApi.put<BusterMetric>(`/metrics/${id}/sharing`, params).then((res) => res.data);
};
