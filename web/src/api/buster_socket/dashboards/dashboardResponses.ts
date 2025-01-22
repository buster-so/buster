import {
  BusterDashboard,
  BusterDashboardListItem,
  BusterDashboardResponse,
  BusterMetricDataResponse
} from '@/api/buster_rest';

export enum DashboardResponses {
  '/dashboards/get:getDashboardState' = '/dashboards/get:getDashboardState',
  '/dashboards/get:fetchingData' = '/dashboards/get:fetchingData',
  '/dashboards/post:postDashboard' = '/dashboards/post:postDashboard',
  '/dashboards/unsubscribe:unsubscribed' = '/dashboards/unsubscribe:unsubscribed',
  '/dashboards/update:updateDashboard' = '/dashboards/update:updateDashboard',
  '/dashboards/list:getDashboardsList' = '/dashboards/list:getDashboardsList',
  '/dashboards/delete:deleteDashboard' = '/dashboards/delete:deleteDashboard'
}

export type DashboardResponses_getDashboardsList = {
  route: '/dashboards/list:getDashboardsList';
  callback: (d: BusterDashboardListItem[]) => void;
  onError?: (d: unknown) => void;
};

export type DashboardResponses_getDashboardState = {
  route: '/dashboards/get:getDashboardState';
  callback: (d: BusterDashboardResponse) => void;
  onError?: (d: unknown) => void;
};

export type DashboardResponses_postDashboard = {
  route: '/dashboards/post:postDashboard';
  callback: (d: BusterDashboard) => void;
  onError?: (d: unknown) => void;
};

export type DashboardResponses_updateDashboard = {
  route: '/dashboards/update:updateDashboard';
  callback: (d: BusterDashboardResponse) => void;
  onError?: (d: unknown) => void;
};

export type DashboardResponses_unsubscribed = {
  route: '/dashboards/unsubscribe:unsubscribed';
  callback: (d: any) => void;
  onError?: (d: unknown) => void;
};

export type DashboardResponses_fetchingData = {
  route: '/dashboards/get:fetchingData';
  callback: (d: BusterMetricDataResponse) => void;
  onError?: (d: unknown) => void;
};

export type DashboardResponse_deleteDashboard = {
  route: '/dashboards/delete:deleteDashboard';
  callback: (d: { ids: string[] }) => void;
  onError?: (d: unknown) => void;
};

export type DashboardResponseTypes =
  | DashboardResponses_unsubscribed
  | DashboardResponses_getDashboardsList
  | DashboardResponses_getDashboardState
  | DashboardResponses_postDashboard
  | DashboardResponses_updateDashboard
  | DashboardResponses_fetchingData;
