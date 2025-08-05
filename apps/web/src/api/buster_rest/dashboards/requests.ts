import type {
  BusterDashboardListItem,
  BusterDashboardResponse,
  DashboardConfig
} from '@/api/asset_interfaces/dashboard';
import type { ShareDeleteRequest, ShareUpdateRequest } from '@buster/server-shared/share';
import mainApi from '@/api/buster_rest/instances';
import { serverFetch } from '@/api/createServerInstance';
import { SharePostRequest } from '@buster/server-shared/share';

export const dashboardsGetList = async (params: {
  /** The page number to fetch */
  page_token: number;
  /** Number of items per page */
  page_size: number;
  /** Filter for dashboards shared with the current user */
  shared_with_me?: boolean;
  /** Filter for dashboards owned by the current user */
  only_my_dashboards?: boolean;
}) => {
  return mainApi.get<BusterDashboardListItem[]>('/dashboards', { params }).then((res) => res.data);
};

export const dashboardsGetDashboard = async ({
  id,
  password,
  version_number
}: {
  /** The unique identifier of the dashboard */
  id: string;
  /** Optional password for accessing protected dashboards */
  password?: string;
  /** The version number of the dashboard */
  version_number?: number;
}) => {
  return await mainApi
    .get<BusterDashboardResponse>(`/dashboards/${id}`, {
      params: { password, version_number }
    })
    .then((res) => res.data);
};

export const getDashboard_server = async ({
  id,
  password,
  version_number
}: Parameters<typeof dashboardsGetDashboard>[0]) => {
  return serverFetch<BusterDashboardResponse>(`/dashboards/${id}`, {
    method: 'GET',
    params: { password, version_number }
  });
};

export const dashboardsCreateDashboard = async (params: {
  /** The name of the dashboard */
  name?: string;
  /** Optional description of the dashboard */
  description?: string | null;
}) => {
  return await mainApi.post<BusterDashboardResponse>('/dashboards', params).then((res) => res.data);
};

export const dashboardsUpdateDashboard = async (params: {
  /** The unique identifier of the dashboard */
  id: string;
  /** New name for the dashboard */
  name?: string;
  /** New description for the dashboard */
  description?: string | null;
  /** Updated dashboard configuration */
  config?: DashboardConfig;
  /** The file content of the dashboard */
  file?: string;
  /** update the version number of the dashboard - default is true */
  update_version?: boolean;
  /** restore the dashboard to a specific version */
  restore_to_version?: number;
}) => {
  return await mainApi
    .put<BusterDashboardResponse>(`/dashboards/${params.id}`, params)
    .then((res) => res.data);
};

export const dashboardsDeleteDashboard = async (data: { ids: string[] }) => {
  return await mainApi.delete<null>('/dashboards', { data }).then((res) => res.data);
};

// share dashboards

export const shareDashboard = async ({ id, params }: { id: string; params: SharePostRequest }) => {
  return mainApi.post<string>(`/dashboards/${id}/sharing`, params).then((res) => res.data);
};

export const unshareDashboard = async ({ id, data }: { id: string; data: ShareDeleteRequest }) => {
  return mainApi.delete<string>(`/dashboards/${id}/sharing`, { data }).then((res) => res.data);
};

export const updateDashboardShare = async ({
  params,
  id
}: {
  id: string;
  params: ShareUpdateRequest;
}) => {
  return mainApi
    .put<BusterDashboardResponse>(`/dashboards/${id}/sharing`, params)
    .then((res) => res.data);
};
