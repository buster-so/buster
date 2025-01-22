import { mainApi } from '../../instances';
import {
  DatasetPermissionsOverviewResponse,
  ListDatasetGroupsResponse,
  ListPermissionGroupsResponse,
  ListPermissionUsersResponse
} from './responseInterfaces';
import * as config from './config';

export const listIndividualDatasetPermissionGroups = async ({
  dataset_id
}: {
  dataset_id: string;
}): Promise<ListPermissionGroupsResponse[]> => {
  return await mainApi.get(`/datasets/${dataset_id}/permission_groups`).then((res) => res.data);
};

export const listDatasetDatasetGroups = async ({
  dataset_id
}: {
  dataset_id: string;
}): Promise<ListDatasetGroupsResponse[]> => {
  return await mainApi.get(`/datasets/${dataset_id}/dataset_groups`).then((res) => res.data);
};

export const listDatasetPermissionUsers = async ({
  dataset_id
}: {
  dataset_id: string;
}): Promise<ListPermissionUsersResponse[]> => {
  return await mainApi.get(`/datasets/${dataset_id}/users`).then((res) => res.data);
};

export const updateDatasetPermissionUsers = async ({
  dataset_id,
  users
}: {
  dataset_id: string;
  users: {
    id: string;
    assigned: boolean;
  }[];
}): Promise<void> => {
  return await mainApi.put(`/datasets/${dataset_id}/users`, users);
};

export const updateDatasetPermissionGroups = async ({
  dataset_id,
  groups
}: {
  dataset_id: string;
  groups: { id: string; assigned: boolean }[];
}): Promise<
  {
    id: string;
    assigned: boolean;
  }[]
> => {
  return await mainApi.put(`/datasets/${dataset_id}/permission_groups`, groups);
};

export const updateDatasetDatasetGroups = async ({
  dataset_id,
  groups
}: {
  dataset_id: string;
  groups: { id: string; assigned: boolean }[];
}): Promise<void> => {
  return await mainApi.put(`/datasets/${dataset_id}/dataset_groups`, groups);
};

export const getDatasetPermissionsOverview = async ({
  dataset_id
}: {
  dataset_id: string;
}): Promise<DatasetPermissionsOverviewResponse> => {
  return await mainApi.get(config.GET_PERMISSIONS_OVERVIEW(dataset_id)).then((res) => res.data);
};
