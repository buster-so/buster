import type { BusterMetric } from '../metric';
import type { BusterShare, ShareRole, VerificationStatus } from '../share';
import type { DashboardConfig } from './dashboardConfigInterfaces';

export interface BusterDashboardListItem {
  created_at: string;
  id: string;
  last_edited: string;
  members: {
    avatar_url: string | null;
    id: string;
    name: string;
  }[];
  name: string;
  owner: {
    avatar_url: string | null;
    id: string;
    name: string;
  };
  status: VerificationStatus;
  is_shared: boolean;
}

export type BusterDashboardResponse = {
  access: ShareRole;
  metrics: Record<string, BusterMetric>;
  dashboard: BusterDashboard;
  permission: ShareRole;
  public_password: string | null;
  collections: {
    id: string;
    name: string;
  }[];
  versions: {
    version_number: number;
    updated_at: string;
  }[];
} & BusterShare;

export interface BusterDashboard {
  config: DashboardConfig;
  created_at: string;
  created_by: string;
  deleted_at: string | null;
  description: string | null;
  id: string;
  name: string;
  updated_at: string | null;
  updated_by: string;
  status: VerificationStatus;
  version_number: number;
  file: string; //yaml file
  file_name: string;
}
