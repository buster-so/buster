import { serverFetch } from '@/api/createServerInstance';
import { mainApi } from '../instances';
import type {
  DatasetGroup,
  GetDatasetGroupPermissionGroupsResponse,
  GetDatasetGroupDatasetsResponse,
  GetDatasetGroupUsersResponse,
  ListDatasetGroupsResponse
} from '../../asset_interfaces';

export const listDatasetGroups = async () => {
  return mainApi.get<ListDatasetGroupsResponse[]>('/dataset_groups').then((res) => res.data);
};

export const createDatasetGroup = async (data: { name: string }) => {
  return mainApi.post('/dataset_groups', data).then((res) => res.data);
};

export const updateDatasetGroup = async (
  data: {
    id: string;
    name: string;
  }[]
) => {
  return mainApi.put('/dataset_groups', data).then((res) => res.data);
};

export const deleteDatasetGroup = async (data: string[]) => {
  return mainApi.delete('/dataset_groups', { data }).then((res) => res.data);
};

export const getDatasetGroup = async (id: string) => {
  return mainApi.get<DatasetGroup>(`/dataset_groups/${id}`).then((res) => res.data);
};

export const getDatasetGroup_server = async (id: string) => {
  return serverFetch<DatasetGroup>(`/dataset_groups/${id}`);
};

export const getDatasetGroupUsers = async (id: string) => {
  return mainApi
    .get<GetDatasetGroupUsersResponse[]>(`/dataset_groups/${id}/users`)
    .then((res) => res.data);
};

export const getDatasetGroupUsers_server = async (id: string) => {
  return serverFetch<GetDatasetGroupUsersResponse[]>(`/dataset_groups/${id}/users`);
};

export const getDatasetGroupDatasets = async (id: string) => {
  return mainApi
    .get<GetDatasetGroupDatasetsResponse[]>(`/dataset_groups/${id}/datasets`)
    .then((res) => res.data);
};

export const getDatasetGroupDatasets_server = async (id: string) => {
  return serverFetch<GetDatasetGroupDatasetsResponse[]>(`/dataset_groups/${id}/datasets`);
};

export const getDatasetGroupPermissionGroups = async (id: string) => {
  return mainApi
    .get<GetDatasetGroupPermissionGroupsResponse[]>(`/dataset_groups/${id}/permission_groups`)
    .then((res) => res.data);
};

export const getDatasetGroupPermissionGroups_server = async (id: string) => {
  return serverFetch<GetDatasetGroupPermissionGroupsResponse[]>(
    `/dataset_groups/${id}/permission_groups`
  );
};

export const updateDatasetGroupUsers = async ({
  datasetGroupId,
  data
}: {
  datasetGroupId: string;
  data: {
    id: string;
    assigned: boolean;
  }[];
}) => {
  return mainApi.put(`/dataset_groups/${datasetGroupId}/users`, data).then((res) => res.data);
};

export const updateDatasetGroupDatasets = async ({
  datasetGroupId,
  groups
}: {
  datasetGroupId: string;
  groups: {
    id: string;
    assigned: boolean;
  }[];
}) => {
  return mainApi.put(`/dataset_groups/${datasetGroupId}/datasets`, groups).then((res) => res.data);
};

export const updateDatasetGroupPermissionGroups = async ({
  datasetGroupId,
  data
}: {
  datasetGroupId: string;
  data: {
    id: string;
    assigned: boolean;
  }[];
}) => {
  return mainApi
    .put(`/dataset_groups/${datasetGroupId}/permission_groups`, data)
    .then((res) => res.data);
};
