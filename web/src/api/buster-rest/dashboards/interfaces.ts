import { DashboardConfig } from '@/api/buster-socket/dashboards/dashboardConfigInterfaces';
import {
  BusterThreadMessageConfig,
  IBusterThreadMessageChartConfig
} from '../threads/threadConfigInterfaces';
import {
  BusterShare,
  BusterThreadListItem,
  BusterThreadMessage,
  BusterVerificationStatus
} from '../threads';
import { ShareRole } from '@/api/buster-socket/threads';
import { BusterCollectionListItem } from '../collection';
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
  status: BusterVerificationStatus;
  is_shared: boolean;
}

export interface BusterDashboardResponse {
  access: ShareRole;
  metrics: BusterDashboardMetric[];
  dashboard: BusterDashboard;
  collections: BusterCollectionListItem[];
  individual_permissions: BusterShare['individual_permissions'];
  organization_permissions: BusterShare['organization_permissions'];
  permission: ShareRole;
  public_password: string | null;
  team_permissions: BusterShare['team_permissions'];
}

export interface BusterDashboard
  extends Omit<
    BusterShare,
    'team_permissions' | 'organization_permissions' | 'individual_permissions' | 'permission'
  > {
  config: DashboardConfig;
  created_at: string;
  created_by: string;
  deleted_at: string | null;
  description: string | null;
  id: string;
  name: string;
  updated_at: string | null;
  updated_by: string;
  status: BusterThreadListItem['status'];
}

export interface BusterDashboardMetric {
  chart_config: BusterThreadMessageConfig;
  time_frame: string | null;
  name: string;
  id: string;
  description: string | null;
  data_metadata: BusterThreadMessage['data_metadata'];
  error: string | null;
  code: string | null;
}

export interface BusterMetricDataResponse {
  data: Record<string, string | number | null>[];
  metric_id: string;
  progress: 'completed';
  code: string | null;
}

export interface IBusterDashboardMetric extends Omit<BusterDashboardMetric, 'chart_config'> {
  chart_config: IBusterThreadMessageChartConfig;
}
