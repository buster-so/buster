import {
  BusterPermissionGroup,
  BusterPermissionListGroup,
  BusterPermissionListTeam,
  BusterPermissionListUser,
  BusterPermissionTeam,
  BusterPermissionUser
} from '@/api/buster_rest/permissions';

export enum PermissionsResponses {
  '/permissions/users/list:listUserPermissions' = '/permissions/users/list:listUserPermissions',
  '/permissions/users/get:getUserPermissions' = '/permissions/users/get:getUserPermissions',
  '/permissions/users/update:updateUserPermission' = '/permissions/users/update:updateUserPermission',
  '/permissions/groups/list:listPermissionGroups' = '/permissions/groups/list:listPermissionGroups',
  '/permissions/groups/update:updatePermissionGroup' = '/permissions/groups/update:updatePermissionGroup',
  '/permissions/groups/get:getPermissionGroup' = '/permissions/groups/get:getPermissionGroup',
  '/permissions/groups/post:postPermissionGroup' = '/permissions/groups/post:postPermissionGroup',
  '/permissions/teams/list:listTeamPermissions' = '/permissions/teams/list:listTeamPermissions',
  '/permissions/teams/update:updateTeamPermission' = '/permissions/teams/update:updateTeamPermission',
  '/permissions/teams/get:getTeamPermissions' = '/permissions/teams/get:getTeamPermissions',
  '/permissions/teams/post:postTeam' = '/permissions/teams/post:postTeam',
  '/permissions/groups/delete:deletePermissionGroup' = '/permissions/groups/delete:deletePermissionGroup',
  '/permissions/teams/delete:deleteTeamPermission' = '/permissions/teams/delete:deleteTeamPermission'
}

export type PermissionsResponsesUsersList_listUsers = {
  route: '/permissions/users/list:listUserPermissions';
  callback: (d: BusterPermissionListUser[]) => void;
  onError?: (d: unknown) => void;
};

export type PermissionResponsesUser_getUserPermissions = {
  route: '/permissions/users/get:getUserPermissions';
  callback: (d: BusterPermissionUser) => void;
  onError?: (d: unknown) => void;
};

export type PermissionResponsesGroup_listPermissionGroups = {
  route: '/permissions/groups/list:listPermissionGroups';
  callback: (d: BusterPermissionListGroup[]) => void;
  onError?: (d: unknown) => void;
};

export type PermissionResponseGroup_updatePermissionGroup = {
  route: '/permissions/groups/update:updatePermissionGroup';
  callback: (d: BusterPermissionGroup) => void;
  onError?: (d: unknown) => void;
};

export type PermissionResponseUser_updateUserPermission = {
  route: '/permissions/users/update:updateUserPermission';
  callback: (d: BusterPermissionUser) => void;
  onError?: (d: unknown) => void;
};

export type PermissionResponseTeam_listPermissionTeams = {
  route: '/permissions/teams/list:listTeamPermissions';
  callback: (d: BusterPermissionListTeam[]) => void;
  onError?: (d: unknown) => void;
};

export type PermissionResponseTeam_updateTeamPermission = {
  route: '/permissions/teams/update:updateTeamPermission';
  callback: (d: BusterPermissionTeam) => void;
  onError?: (d: unknown) => void;
};

export type PermissionResponseTeam_getTeamPermission = {
  route: '/permissions/teams/get:getTeamPermissions';
  callback: (d: BusterPermissionTeam) => void;
  onError?: (d: unknown) => void;
};

export type PermissionResponseGroup_getPermissionGroup = {
  route: '/permissions/groups/get:getPermissionGroup';
  callback: (d: BusterPermissionGroup) => void;
  onError?: (d: unknown) => void;
};

export type PermissionGroupPost_createPermissionGroup = {
  route: '/permissions/groups/post:postPermissionGroup';
  callback: (d: BusterPermissionGroup) => void;
  onError?: (d: unknown) => void;
};

export type PermissionTeamPost_createPermissionTeam = {
  route: '/permissions/teams/post:postTeam';
  callback: (d: BusterPermissionTeam) => void;
  onError?: (d: unknown) => void;
};

export type PermissionGroupDelete_deletePermissionGroup = {
  route: '/permissions/groups/delete:deletePermissionGroup';
  callback: (d: { ids: string[] }) => void;
  onError?: (d: unknown) => void;
};

export type PermissionTeamDelete_deleteTeamPermission = {
  route: '/permissions/teams/delete:deleteTeamPermission';
  callback: (d: { ids: string[] }) => void;
  onError?: (d: unknown) => void;
};

export type PermissionsResponseTypes =
  | PermissionsResponsesUsersList_listUsers
  | PermissionResponsesUser_getUserPermissions
  | PermissionResponsesGroup_listPermissionGroups
  | PermissionResponseGroup_updatePermissionGroup
  | PermissionResponseUser_updateUserPermission
  | PermissionResponseTeam_listPermissionTeams
  | PermissionResponseTeam_updateTeamPermission
  | PermissionResponseTeam_getTeamPermission
  | PermissionResponseGroup_getPermissionGroup
  | PermissionGroupPost_createPermissionGroup
  | PermissionTeamPost_createPermissionTeam
  | PermissionGroupDelete_deletePermissionGroup
  | PermissionTeamDelete_deleteTeamPermission;
