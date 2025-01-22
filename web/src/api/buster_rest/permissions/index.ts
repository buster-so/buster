import { BusterDatasetListItem } from '../datasets';
import { BusterOrganizationRole } from '../users';

export interface BusterPermissionListUser {
  id: string;
  email: string;
  name: string;
  role: BusterOrganizationRole;
  belongs_to: boolean;
  //only shows up with no filters. To lazy to type this out better
  team_role?: BusterOrganizationRole;
  //???
  team_count: number;
  permission_group_count: number;
}

export interface BusterPermissionUser {
  id: string;
  email: string;
  name: string;
  role: BusterOrganizationRole;
  created_at: string;
  permission_group_count: number;
  permission_groups: {
    dataset_count: number;
    id: string;
    identities: ('User' | 'Team')[];
    name: string;
  }[];
  queries_last_30_days: number;
  team_count: number;
  teams: {
    id: string;
    member_count: number;
    name: string;
    team_role: BusterOrganizationRole;
  }[];
  updated_at: string;
  edit_sql: boolean;
  export_assets: boolean;
  email_slack_enabled: boolean;
  upload_csv: boolean;
  sharing_setting: 'none' | 'team' | 'organization' | 'public';
  dataset_count: number;
}

export interface BusterPermissionListTeam {
  id: string;
  name: string;
  member_count: number;
  permission_group_count: number;
  team_role: BusterOrganizationRole;
  belongs_to: boolean;
}

export interface BusterPermissionTeam {
  id: string;
  name: string;
  member_count: number;
  sharing_setting: BusterPermissionUser['sharing_setting'];
  edit_sql: boolean;
  export_assets: boolean;
  email_slack_enabled: boolean;
  upload_csv: boolean;
  created_at: string;
  updated_at: string;
  permission_group_count: number;
  users: {
    email: string;
    id: string;
    name: string;
    role: BusterOrganizationRole;
  }[];
  permission_groups: {
    dataset_count: number;
    id: string;
    identities: ('User' | 'Team')[];
    name: string;
  }[];
  organization_id: string;
  created_by: {
    name: string;
    id: string;
  };
}

export interface BusterPermissionListGroup {
  id: string;
  name: string;
  dataset_count: number;
  belongs_to: boolean;
  teams?: { id: string; name: string }[];
  //only shows up with no filters. To lazy to type this out better
  team_count?: number;
  member_count?: number;
}

export interface BusterPermissionGroup {
  id: string;
  name: string;
  dataset_count: number;
  member_count: number;
  team_count: number;
  created_by: {
    name: string;
    id: string;
  };
  updated_at: string;
  datasets: BusterDatasetListItem[];
  deleted_at: string | null;
  organization_id: string;
  teams: {
    id: string;
    member_count: number;
    name: string;
    team_role: BusterOrganizationRole;
  }[];
  updated_by: string;
  user_count: number;
  users: BusterPermissionListUser[];
}
