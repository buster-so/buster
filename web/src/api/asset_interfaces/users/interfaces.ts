import type { BusterOrganization, BusterOrganizationRole } from '../organizations';
import type { BusterPermissionUser } from '../permission';
import type { ShareAssetType } from '../share';

export interface BusterUserPalette {
  id: string;
  palette: string[];
}

export enum TeamRole {
  MANAGER = 'manager',
  MEMBER = 'member',
  NONE = 'none'
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
  asset_type: ShareAssetType;
  index?: number;
  name: string;
}

export type BusterUserFavoriteAsset = {
  id: string;
  ype: ShareAssetType;
  index?: number;
  title: string;
};

export interface BusterUser {
  config: Record<string, unknown>;
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
  organizations: BusterOrganization[] | null;
}

export interface BusterUserListItem {
  email: string;
  id: string;
  name: string;
  role: null;
}

export interface OrganizationUser {
  id: string;
  email: string;
  name: string;
  status: 'active' | 'inactive';
  role: BusterOrganizationRole;
  datasets: OrganizationUserDataset[];
}

export interface OrganizationUserDataset {
  can_query: boolean;
  id: string;
  name: string;
  lineage: {
    name: string;
    id: string;
    type: 'user' | 'datasets' | 'permissionGroups';
  }[][];
}
