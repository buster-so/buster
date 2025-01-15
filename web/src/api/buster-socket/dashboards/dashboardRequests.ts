import { BusterVerificationStatus } from '@/api/buster-rest';
import { BusterSocketRequestBase } from '../baseInterfaces';
import { ShareRole } from '../threads';
import { DashboardConfig } from './dashboardConfigInterfaces';

export type DashboardsListEmitPayload = BusterSocketRequestBase<
  '/dashboards/list',
  {
    page: number;
    page_size: number;
    filters?: {
      shared_with_me?: boolean;
      only_my_dashboards?: boolean;
    };
  }
>;

export type DashboardSubscribeToDashboard = BusterSocketRequestBase<
  '/dashboards/get',
  { id: string; password?: string }
>;

export type DashboardUnsubscribeFromDashboard = BusterSocketRequestBase<
  '/dashboards/unsubscribe',
  { id: string }
>;

export type DashboardUnsubscribeFromAll = BusterSocketRequestBase<'/dashboards/unsubscribe', {}>;

export type DashboardCreate = BusterSocketRequestBase<
  '/dashboards/post',
  { name: string; description?: string | null }
>;

export type ShareRequest = {
  //SHARE PERMISSIONS
  id: string;
  user_permissions?: {
    user_email: string;
    role: ShareRole;
  }[];

  remove_users?: string[]; // user_id
  team_permissions?: {
    team_id: string;
    role: ShareRole;
  }[];
  remove_teams?: string[]; // team_id
  publicly_accessible?: boolean;
  public_password?: string | null;
  public_expiry_date?: string | null; //timestamptz
};

export type DashboardUpdate = BusterSocketRequestBase<
  '/dashboards/update',
  {
    id: string;
    name?: string;
    description?: string | null;
    config?: DashboardConfig;
    status?: BusterVerificationStatus;
    add_to_collections?: string[]; // collection_id
    remove_from_collections?: string[]; // collection_id
    remove_users?: string[]; // user_id
    threads?: string[]; // thread_id
  } & ShareRequest
>;

export type DashboardDelete = BusterSocketRequestBase<'/dashboards/delete', { ids: string[] }>;

export type DashboardEmits =
  | DashboardsListEmitPayload
  | DashboardSubscribeToDashboard
  | DashboardUnsubscribeFromDashboard
  | DashboardUnsubscribeFromAll
  | DashboardCreate
  | DashboardUpdate
  | DashboardDelete;
