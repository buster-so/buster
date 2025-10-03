import type {
  BulkUpdateMetricVerificationStatusRequest,
  BulkUpdateMetricVerificationStatusResponse,
  DeleteMetricRequest,
  DeleteMetricResponse,
  DuplicateMetricRequest,
  DuplicateMetricResponse,
  GetMetricDataRequest,
  GetMetricListRequest,
  GetMetricParams,
  GetMetricQuery,
  GetMetricResponse,
  ListMetricsResponse,
  MetricDataResponse,
  MetricDownloadParams,
  MetricDownloadQueryParams,
  MetricDownloadResponse,
  ShareMetricUpdateResponse,
  UpdateMetricRequest,
  UpdateMetricResponse,
} from '@buster/server-shared/metrics';
import type {
  ShareDeleteRequest,
  ShareDeleteResponse,
  SharePostRequest,
  SharePostResponse,
  ShareUpdateRequest,
} from '@buster/server-shared/share';
import { mainApi, mainApiV2 } from '../instances';

export const getMetric = async ({
  id,
  ...params
}: GetMetricParams & GetMetricQuery): Promise<GetMetricResponse> => {
  return mainApiV2
    .get<GetMetricResponse>(`/metric_files/${id}`, { params })
    .then(({ data }) => data);
};

export const getMetricData = async ({
  id,
  filter_values,
  ...params
}: GetMetricDataRequest & GetMetricParams): Promise<MetricDataResponse> => {
  const queryParams = {
    ...params,
    ...(filter_values && { filter_values: JSON.stringify(filter_values) }),
  };
  return mainApiV2
    .get<MetricDataResponse>(`/metric_files/${id}/data`, { params: queryParams })
    .then((res) => res.data);
};

export const listMetrics = async (params: GetMetricListRequest) => {
  return mainApi.get<ListMetricsResponse>('/metric_files', { params }).then((res) => res.data);
};

export const updateMetric = async (params: UpdateMetricRequest) => {
  return mainApi
    .put<UpdateMetricResponse>(`/metric_files/${params.id}`, params)
    .then((res) => res.data);
};

export const deleteMetrics = async (data: DeleteMetricRequest) => {
  return mainApi
    .delete<DeleteMetricResponse>('/metric_files', {
      data,
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
  return mainApiV2
    .post<SharePostResponse>(`/metric_files/${id}/sharing`, params)
    .then((res) => res.data);
};

export const unshareMetric = async ({ id, data }: { id: string; data: ShareDeleteRequest }) => {
  return mainApiV2
    .delete<ShareDeleteResponse>(`/metric_files/${id}/sharing`, { data })
    .then((res) => res.data);
};

export const updateMetricShare = async ({
  params,
  id,
}: {
  id: string;
  params: ShareUpdateRequest;
}) => {
  return mainApiV2
    .put<ShareMetricUpdateResponse>(`/metric_files/${id}/sharing`, params)
    .then((res) => res.data);
};

// Download metric file
export const downloadMetricFile = async ({
  id,
  ...params
}: MetricDownloadParams & MetricDownloadQueryParams): Promise<MetricDownloadResponse> => {
  return mainApiV2
    .get<MetricDownloadResponse>(`/metric_files/${id}/download`, { params })
    .then((res) => res.data);
};
