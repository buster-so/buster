export interface DatasetGroup {
  id: string;
  name: string;
}

export interface GetDatasetGroupUsersResponse {
  id: string;
  assigned: boolean;
  name: string;
  email: string;
  avatar_url: string;
}

export interface GetDatasetGroupDatasetsResponse {
  id: string;
  assigned: boolean;
  name: string;
}

export interface GetDatasetGroupPermissionGroupsResponse {
  id: string;
  assigned: boolean;
  name: string;
}
