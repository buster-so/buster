import { BusterOrganizationRole } from '@/api/buster_rest';
import { BusterSocketRequestBase } from '../baseInterfaces';
import { BusterPermissionUser } from '@/api/buster_rest/permissions';

export type PermissionsListUsersRequest = BusterSocketRequestBase<
  '/permissions/users/list',
  {
    page: number;
    page_size: number;
    team_id?: string;
    permission_group_id?: string;
    belongs_to?: boolean | null;
  }
>;

export type PermissionUserRequest = BusterSocketRequestBase<
  '/permissions/users/get',
  {
    id: string;
  }
>;

export type PermissionUserUpdateRequest = BusterSocketRequestBase<
  '/permissions/users/update',
  {
    id: string;
    sharing_setting?: BusterPermissionUser['sharing_setting']; // optional:
    edit_sql?: boolean; // optional:
    upload_csv?: boolean; // optional:
    export_assets?: boolean; // optional:
    email_slack_enabled?: boolean; // optional:
    teams?: {
      id: string;
      role: BusterOrganizationRole;
    }[]; // optional:
    permission_groups?: string[];
    name?: string;
  }
>;

export type PermissionGetPermissionGroup = BusterSocketRequestBase<
  '/permissions/groups/get',
  {
    id: string;
  }
>;

export type PermissionsListGroupRequest = BusterSocketRequestBase<
  '/permissions/groups/list',
  {
    page: number;
    page_size: number;
    team_id?: string;
    user_id?: string;
    belongs_to?: boolean | null;
  }
>;

export type PermissionPostGroupRequest = BusterSocketRequestBase<
  '/permissions/groups/post',
  {
    name: string;
  }
>;

export type PermissionGetPermissionTeam = BusterSocketRequestBase<
  '/permissions/teams/get',
  {
    id: string;
  }
>;

export type PermissionGroupUpdateRequest = BusterSocketRequestBase<
  '/permissions/groups/update',
  {
    id: string;
    name?: string; // optional:
    users?: null | string[]; // optional: null will do no changes, empty will clear out
    teams?: string[]; // optional: null will do no changes, empty will clear out
    datasets?: string[]; // optional: null will do no changes, empty will clear out
  }
>;

export type PermissionListTeamRequest = BusterSocketRequestBase<
  '/permissions/teams/list',
  {
    page: number;
    page_size: number;
    user_id?: string;
    permission_group_id?: string;
    belongs_to?: boolean | null;
  }
>;

export type PermissionPostTeamRequest = BusterSocketRequestBase<
  '/permissions/teams/post',
  {
    name: string;
    description?: string;
  }
>;

export type PermissionPostUserRequest = BusterSocketRequestBase<
  '/permissions/users/post',
  {
    email: string;
    role: BusterOrganizationRole;
  }
>;

export type PermissionTeamUpdateRequest = BusterSocketRequestBase<
  '/permissions/teams/update',
  {
    id: string;
    sharing_setting?: BusterPermissionUser['sharing_setting']; // optional:
    edit_sql?: boolean; // optional:
    upload_csv?: boolean; // optional:
    export_assets?: boolean; // optional:
    email_slack_enabled?: boolean; // optional:
    teams?: {
      id: string;
      role: BusterOrganizationRole;
    }[]; // optional:
    permission_groups?: string[];
    name?: string;
    users?: { id: string; role: BusterOrganizationRole }[];
  }
>;

export type PermissionGroupDeleteRequest = BusterSocketRequestBase<
  '/permissions/groups/delete',
  {
    ids: string[];
  }
>;

export type PermissionTeamDeleteRequest = BusterSocketRequestBase<
  '/permissions/teams/delete',
  {
    ids: string[];
  }
>;

export type PermissionsEmits =
  | PermissionTeamDeleteRequest
  | PermissionsListUsersRequest
  | PermissionUserRequest
  | PermissionGetPermissionGroup
  | PermissionGetPermissionTeam
  | PermissionsListGroupRequest
  | PermissionListTeamRequest
  | PermissionPostGroupRequest
  | PermissionPostTeamRequest
  | PermissionPostUserRequest
  | PermissionGroupUpdateRequest
  | PermissionUserUpdateRequest
  | PermissionTeamUpdateRequest
  | PermissionGroupDeleteRequest;
