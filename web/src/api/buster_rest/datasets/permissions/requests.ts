import type {
  DatasetPermissionsOverviewResponse,
  ListDatasetGroupsResponse,
  ListPermissionGroupsResponse,
  ListPermissionUsersResponse
} from '../../../asset_interfaces';
import { serverFetch } from '../../../createServerInstance';
import { mainApi } from '../../instances';

export const listIndividualDatasetPermissionGroups = async (params: {
  dataset_id: string;
}): Promise<ListPermissionGroupsResponse[]> => {
  return await mainApi
    .get(`/datasets/${params.dataset_id}/permission_groups`)
    .then((res) => res.data);
};

export const listDatasetDatasetGroups = async (params: { dataset_id: string }) => {
  return await mainApi
    .get<ListDatasetGroupsResponse[]>(`/datasets/${params.dataset_id}/dataset_groups`)
    .then((res) => res.data);
};

export const listDatasetPermissionUsers = async (params: {
  dataset_id: string;
}): Promise<ListPermissionUsersResponse[]> => {
  return await mainApi.get(`/datasets/${params.dataset_id}/users`).then((res) => res.data);
};

export const updateDatasetPermissionUsers = async (params: {
  dataset_id: string;
  users: {
    id: string;
    assigned: boolean;
  }[];
}): Promise<void> => {
  return await mainApi.put(`/datasets/${params.dataset_id}/users`, params.users);
};

export const updateDatasetPermissionGroups = async (params: {
  dataset_id: string;
  groups: {
    id: string;
    assigned: boolean;
  }[];
}): Promise<
  {
    id: string;
    assigned: boolean;
  }[]
> => {
  return await mainApi.put(`/datasets/${params.dataset_id}/permission_groups`, params.groups);
};

export const updateDatasetDatasetGroups = async (params: {
  dataset_id: string;
  groups: {
    id: string;
    assigned: boolean;
  }[];
}): Promise<void> => {
  return await mainApi.put(`/datasets/${params.dataset_id}/dataset_groups`, params.groups);
};

const GET_PERMISSIONS_OVERVIEW = (datasetId: string) => `/datasets/${datasetId}/overview`;

export const getDatasetPermissionsOverview = async (params: {
  dataset_id: string;
}): Promise<DatasetPermissionsOverviewResponse> => {
  return await mainApi.get(GET_PERMISSIONS_OVERVIEW(params.dataset_id)).then((res) => res.data);
};

export const getDatasetPermissionsOverview_server = async (datasetId: string) => {
  const response = await serverFetch<DatasetPermissionsOverviewResponse>(
    GET_PERMISSIONS_OVERVIEW(datasetId)
  );
  return response;
};
