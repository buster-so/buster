import { TeamRole } from '../interfaces';

export interface BusterUserDatasetGroup {
  id: string;
  name: string;
  permission_count: number;
  assigned: boolean;
}

export interface BusterUserDataset {
  id: string;
  name: string;
  user_id: string;
  assigned: boolean;
}

export interface BusterUserAttribute {
  name: string;
  value: string | number | boolean;
  read_only: boolean;
}

export interface BusterUserTeamListItem {
  id: string;
  name: string;
  user_count: number;
  role: TeamRole;
}

export interface BusterUserPermissionGroup {
  id: string;
  assigned: boolean;
  name: string;
  dataset_count: number;
}
