export interface ListPermissionGroupsResponse {
  id: string;
  name: string;
  assigned: boolean;
}

export interface ListDatasetGroupsResponse {
  id: string;
  name: string;
  assigned: boolean;
}

export interface ListPermissionUsersResponse {
  id: string;
  name: string;
  email: string;
  assigned: boolean;
}

export interface DatasetPermissionOverviewUser {
  id: string;
  name: string;
  email: string;
  can_query: boolean;
  lineage: {
    name: string;
    id: string;
    type: 'user' | 'datasets' | 'permissionGroups';
  }[][];
}

export interface DatasetPermissionsOverviewResponse {
  dataset_id: string;
  users: DatasetPermissionOverviewUser[];
}

export interface ListDatasetGroupsResponse {
  id: string;
  name: string;
  assigned: boolean;
}
