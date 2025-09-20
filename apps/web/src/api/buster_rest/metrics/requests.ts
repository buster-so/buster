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
  MetricDownloadResponse,
  ShareDeleteResponse,
  ShareUpdateResponse,
  UpdateMetricRequest,
  UpdateMetricResponse,
} from '@buster/server-shared/metrics';
import type {
  ShareDeleteRequest,
  SharePostRequest,
  ShareUpdateRequest,
} from '@buster/server-shared/share';
import { mainApi, mainApiV2 } from '../instances';

export const getMetric = async ({
  id,
  ...params
}: GetMetricParams & GetMetricQuery): Promise<GetMetricResponse> => {
  return mainApiV2.get<GetMetricResponse>(`/metric_files/${id}`, { params }).then((res) => {
    return res.data;
  });
};

export const getMetricData = async ({
  id,
  ...params
}: GetMetricDataRequest & GetMetricParams): Promise<MetricDataResponse> => {
  return mainApiV2
    .get<MetricDataResponse>(`/metric_files/${id}/data`, { params })
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
  return mainApi.post<string>(`/metric_files/${id}/sharing`, params).then((res) => res.data);
};

export const unshareMetric = async ({ id, data }: { id: string; data: ShareDeleteRequest }) => {
  return mainApi
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
  return mainApi
    .put<ShareUpdateResponse>(`/metric_files/${id}/sharing`, params)
    .then((res) => res.data);
};

// Download metric file
export const downloadMetricFile = async (id: string): Promise<MetricDownloadResponse> => {
  return mainApiV2
    .get<MetricDownloadResponse>(`/metric_files/${id}/download`)
    .then((res) => res.data);
};
