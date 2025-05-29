import type {
  BusterUserAttribute,
  BusterUserDataset,
  BusterUserDatasetGroup,
  BusterUserPermissionGroup,
  BusterUserTeamListItem,
  TeamRole
} from '@/api/asset_interfaces/users';
import { serverFetch } from '../../../createServerInstance';
import { mainApi } from '../../instances';

export const getUserDatasetGroups = async ({ userId }: { userId: string }) => {
  return mainApi
    .get<BusterUserDatasetGroup[]>(`/users/${userId}/dataset_groups`)
    .then(({ data }) => data);
};

export const getUserDatasetGroups_server = async ({ userId }: { userId: string }) => {
  return serverFetch<BusterUserDatasetGroup[]>(`/users/${userId}/dataset_groups`);
};

export const getUserDatasets = async ({ userId }: { userId: string }) => {
  return mainApi.get<BusterUserDataset[]>(`/users/${userId}/datasets`).then(({ data }) => data);
};

export const getUserDatasets_server = async ({ userId }: { userId: string }) => {
  return serverFetch<BusterUserDataset[]>(`/users/${userId}/datasets`);
};

export const getUserAttributes = async ({ userId }: { userId: string }) => {
  return mainApi.get<BusterUserAttribute[]>(`/users/${userId}/attributes`).then(({ data }) => data);
};

export const getUserAttributes_server = async ({ userId }: { userId: string }) => {
  return serverFetch<BusterUserAttribute[]>(`/users/${userId}/attributes`);
};

export const getUserTeams = async ({ userId }: { userId: string }) => {
  return mainApi.get<BusterUserTeamListItem[]>(`/users/${userId}/teams`).then(({ data }) => data);
};

export const getUserTeams_server = async ({ userId }: { userId: string }) => {
  return serverFetch<BusterUserTeamListItem[]>(`/users/${userId}/teams`);
};

export const getUserPermissionGroups = async ({ userId }: { userId: string }) => {
  return mainApi
    .get<BusterUserPermissionGroup[]>(`/users/${userId}/permission_groups`)
    .then(({ data }) => data);
};

export const getUserPermissionGroups_server = async ({ userId }: { userId: string }) => {
  return serverFetch<BusterUserPermissionGroup[]>(`/users/${userId}/permission_groups`);
};

export const updateUserTeams = async (userId: string, teams: { id: string; role: TeamRole }[]) => {
  return mainApi.put(`/users/${userId}/teams`, teams).then(({ data }) => data);
};

export const updateUserPermissionGroups = async (
  userId: string,
  permissionGroups: { id: string; assigned: boolean }[]
) => {
  return mainApi
    .put(`/users/${userId}/permission_groups`, permissionGroups)
    .then(({ data }) => data);
};

export const updateUserDatasetGroups = async (
  userId: string,
  datasetGroups: { id: string; assigned: boolean }[]
) => {
  return mainApi.put(`/users/${userId}/dataset_groups`, datasetGroups).then(({ data }) => data);
};

export const updateUserDatasets = async (
  userId: string,
  datasets: { id: string; assigned: boolean }[]
) => {
  return mainApi.put(`/users/${userId}/datasets`, datasets).then(({ data }) => data);
};
