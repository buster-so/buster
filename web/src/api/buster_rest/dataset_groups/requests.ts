import { serverFetch } from '@/api/createServerInstance';
import { mainApi } from '../instances';
import {
  DatasetGroup,
  GetDatasetGroupPermissionGroupsResponse,
  GetDatasetGroupDatasetsResponse,
  GetDatasetGroupUsersResponse
} from './responseInterfaces';

export const listDatasetGroups = async () => {
  return mainApi.get<DatasetGroup[]>(`/dataset_groups`).then((res) => res.data);
};

export const createDatasetGroup = async (data: { name: string }) => {
  return mainApi.post(`/dataset_groups`, data).then((res) => res.data);
};

export const updateDatasetGroup = async (data: { id: string; name: string }[]) => {
  return mainApi.put(`/dataset_groups`, data).then((res) => res.data);
};

export const deleteDatasetGroup = async (id: string) => {
  return mainApi.delete(`/dataset_groups/${id}`).then((res) => res.data);
};

export const getDatasetGroup = async (id: string) => {
  return mainApi.get(`/dataset_groups/${id}`).then((res) => res.data);
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

export const updateDatasetGroupUsers = async (
  id: string,
  data: { id: string; assigned: boolean }[]
) => {
  return mainApi.put(`/dataset_groups/${id}/users`, data).then((res) => res.data);
};

export const updateDatasetGroupDatasets = async (
  id: string,
  data: { id: string; assigned: boolean }[]
) => {
  return mainApi.put(`/dataset_groups/${id}/datasets`, data).then((res) => res.data);
};

export const updateDatasetGroupPermissionGroups = async (
  id: string,
  data: { id: string; assigned: boolean }[]
) => {
  return mainApi.put(`/dataset_groups/${id}/permission_groups`, data).then((res) => res.data);
};
