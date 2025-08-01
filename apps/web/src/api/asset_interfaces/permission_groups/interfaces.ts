export interface GetPermissionGroupResponse {
  created_at: string;
  created_by: string;
  id: string;
  name: string;
  organization_id: string;
  updated_at: string;
  updated_by: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- empty object type is valid
export interface CreatePermissionGroupResponse extends GetPermissionGroupResponse {}

export interface GetPermissionGroupUsersResponse {
  id: string;
  assigned: boolean;
  email: string;
  name: string;
  avatar_url: string | null;
}

export interface GetPermissionGroupDatasetsResponse {
  id: string;
  assigned: boolean;
  name: string;
}

export interface GetPermissionGroupDatasetGroupsResponse {
  id: string;
  assigned: boolean;
  name: string;
  created_at: string;
  updated_at: string;
}
