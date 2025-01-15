import { ShareRole } from '@/api/buster-socket/threads';
import { BusterPermissionUser } from '../permissions';

export interface BusterUserPalette {
  id: string;
  palette: string[];
}

export enum BusterOrganizationRole {
  WORKSPACE_ADMIN = 'workspaceAdmin',
  DATA_ADMIN = 'dataAdmin',
  QUERIER = 'querier',
  RESTRICTED_QUERIER = 'restrictedQuerier'
}

export enum TeamRole {
  MANAGER = 'manager',
  MEMBER = 'member'
}

export interface BusterUserTeam {
  id: string;
  name: string;
  edit_sql: boolean;
  email_slack_enabled: boolean;
  export_assets: boolean;
  organization_id: string;
  sharing_settings: BusterPermissionUser['sharing_setting'];
  upload_csv: boolean;
  updated_at: string;
  created_at: string;
  deleted_at: string | null;
  role: TeamRole;
}

export interface BusterUserFavorite {
  id: string;
  type: BusterShareAssetType;
  index?: number;
  name: string;
  //collections
  collection_name?: string;
  collection_id?: string;
  assets?: {
    id: string;
    type: BusterShareAssetType;
    name: string;
  }[];
}

export enum BusterShareAssetType {
  THREAD = 'thread',
  DASHBOARD = 'dashboard',
  COLLECTION = 'collection'
}

export interface BusterUser {
  config: {};
  created_at: string;
  email: string;
  favorites: BusterUserFavorite[];
  id: string;
  name: string;
  updated_at: string;
}

export interface BusterUserResponse {
  user: BusterUser;
  teams: BusterUserTeam[];
  organizations: BusterOrganization[];
}

export interface BusterOrganization {
  created_at: string;
  id: string;
  deleted_at: string | null;
  domain: string;
  name: string;
  updated_at: string;
  role: BusterOrganizationRole;
}

export interface BusterUserListItem {
  email: string;
  id: string;
  name: string;
  role: null;
}

export interface BusterUserTeamListItem {
  id: string;
  name: string;
  user_id: string;
}
