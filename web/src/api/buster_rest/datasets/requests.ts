import { serverFetch } from '@/api/createServerInstance';
import type { BusterDataset, BusterDatasetListItem, IDataResult } from '../../asset_interfaces';
import { mainApi } from '../instances';

export const getDatasets = async (params?: {
  /** Current page number */
  page?: number;
  /** Number of items to display per page */
  page_size?: number;
  /** Search term to filter datasets */
  search?: string;
  /** When true, returns admin view of datasets */
  admin_view?: boolean;
  /** When true, returns only imported datasets */
  imported?: boolean;
  /** When true, returns only enabled datasets */
  enabled?: boolean;
  /** Filter by permission group ID */
  permission_group_id?: string;
  /** Filter by owner */
  belongs_to?: string;
}): Promise<BusterDatasetListItem[]> => {
  const { page = 0, page_size = 1000, ...allParams } = params || {};
  return mainApi
    .get<BusterDatasetListItem[]>('/datasets', { params: { page, page_size, ...allParams } })
    .then((res) => res.data);
};

export const getDatasets_server = async (
  params?: Parameters<typeof getDatasets>[0]
): Promise<BusterDatasetListItem[]> => {
  const { page = 0, page_size = 1000, ...allParams } = params || {};
  return await serverFetch<BusterDatasetListItem[]>('/datasets', {
    params: { page, page_size, ...allParams }
  });
};

const GET_DATASET_URL = (datasetId: string) => `/datasets/${datasetId}`;

export const getDatasetMetadata = async (datasetId: string): Promise<BusterDataset> => {
  return await mainApi.get<BusterDataset>(GET_DATASET_URL(datasetId)).then((res) => res.data);
};

export const getDatasetMetadata_server = async (datasetId: string) => {
  return await serverFetch<BusterDataset>(GET_DATASET_URL(datasetId));
};

export const getDatasetDataSample = async (datasetId: string) => {
  return await mainApi
    .get<IDataResult>(`/datasets/${datasetId}/data/sample`)
    .then((res) => res.data);
};

export const createDataset = async (params: {
  /** The name of the dataset */
  name: string;
  /** The ID of the data source */
  data_source_id: string;
}): Promise<BusterDataset> => {
  return await mainApi.post<BusterDataset>('/datasets', params).then((res) => res.data);
};

export const deleteDataset = async (datasetIds: string[]): Promise<void> => {
  return await mainApi.delete('/datasets', { data: { ids: datasetIds } }).then((res) => res.data);
};

export const deployDataset = async ({
  dataset_id,
  ...params
}: {
  /** The ID of the dataset to deploy */
  dataset_id: string;
  /** SQL query for the dataset */
  sql: string;
  /** YML configuration for the dataset */
  yml: string;
}): Promise<void> => {
  return await mainApi
    .post('/datasets/deploy', { id: dataset_id, ...params })
    .then((res) => res.data);
};

export const updateDataset = async (data: { id: string; name: string }) => {
  return await mainApi.put(`/datasets/${data.id}`, data).then((res) => res.data);
};
