import type {
  BulkUpdateMetricVerificationStatusRequest,
  BulkUpdateMetricVerificationStatusResponse,
  DeleteMetricRequest,
  DeleteMetricResponse,
  DuplicateMetricRequest,
  DuplicateMetricResponse,
  GetMetricDataRequest,
  ListMetricsResponse,
  UpdateMetricRequest,
  GetMetricRequest,
  GetMetricListRequest,
  ShareDeleteResponse,
  MetricDataResponse,
  GetMetricResponse,
  UpdateMetricResponse,
  ShareUpdateResponse
} from '@buster/server-shared/metrics';
import type { ShareDeleteRequest, ShareUpdateRequest } from '@buster/server-shared/share';
import { serverFetch } from '@/api/createServerInstance';
import { mainApi } from '../instances';
import { SharePostRequest } from '@buster/server-shared/share';

export const getMetric = async (params: GetMetricRequest): Promise<GetMetricResponse> => {
  return mainApi
    .get<GetMetricResponse>(`/metric_files/${params.id}`, {
      params
    })
    .then((res) => res.data);
};

export const getMetric_server = async ({ id, password }: Parameters<typeof getMetric>[0]) => {
  return await serverFetch<GetMetricResponse>(`/metric_files/${id}`, {
    params: { ...(password && { password }) }
  });
};

export const getMetricData = async ({
  id,
  version_number,
  password
}: GetMetricDataRequest): Promise<MetricDataResponse> => {
  return mainApi
    .get<MetricDataResponse>(`/metric_files/${id}/data`, { params: { password, version_number } })
    .then((res) => res.data);
};

export const listMetrics = async (params: GetMetricListRequest) => {
  return mainApi.get<ListMetricsResponse>('/metric_files', { params }).then((res) => res.data);
};

export const listMetrics_server = async (params: Parameters<typeof listMetrics>[0]) => {
  return await serverFetch<ListMetricsResponse>('/metric_files', { params });
};

export const updateMetric = async (params: UpdateMetricRequest) => {
  return mainApi
    .put<UpdateMetricResponse>(`/metric_files/${params.id}`, params)
    .then((res) => res.data);
};

export const deleteMetrics = async (data: DeleteMetricRequest) => {
  return mainApi
    .delete<DeleteMetricResponse>('/metric_files', {
      data
    })
    .then((res) => res.data);
};

export const duplicateMetric = async (params: DuplicateMetricRequest) => {
  return mainApi
    .post<DuplicateMetricResponse>('/metric_files/duplicate', params)
    .then((res) => res.data);
};

export const bulkUpdateMetricVerificationStatus = async (
  params: BulkUpdateMetricVerificationStatusRequest
) => {
  return mainApi
    .put<BulkUpdateMetricVerificationStatusResponse>('/metric_files', params)
    .then((res) => res.data);
};

// share metrics

export const shareMetric = async ({ id, params }: { id: string; params: SharePostRequest }) => {
  return mainApi.post<string>(`/metric_files/${id}/sharing`, params).then((res) => res.data);
};

export const unshareMetric = async ({ id, data }: { id: string; data: ShareDeleteRequest }) => {
  return mainApi
    .delete<ShareDeleteResponse>(`/metric_files/${id}/sharing`, { data })
    .then((res) => res.data);
};

export const updateMetricShare = async ({
  params,
  id
}: {
  id: string;
  params: ShareUpdateRequest;
}) => {
  return mainApi
    .put<ShareUpdateResponse>(`/metric_files/${id}/sharing`, params)
    .then((res) => res.data);
};
