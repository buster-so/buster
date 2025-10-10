import type {
  DashboardConfig,
  GetDashboardParams,
  GetDashboardQuery,
  GetDashboardResponse,
} from '@buster/server-shared/dashboards';
import type {
  ShareDeleteRequest,
  ShareDeleteResponse,
  SharePostRequest,
  SharePostResponse,
  ShareUpdateRequest,
} from '@buster/server-shared/share';
import type { BusterDashboardListItem } from '@/api/asset_interfaces/dashboard';
import { mainApi, mainApiV2 } from '@/api/buster_rest/instances';

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

export const getDashboardById = async ({
  id,
  password,
  version_number,
}: GetDashboardParams & GetDashboardQuery) => {
  return await mainApiV2
    .get<GetDashboardResponse>(`/dashboards/${id}`, {
      params: { password, version_number },
    })
    .then((res) => res.data);
};

export const dashboardsCreateDashboard = async (params: {
  /** The name of the dashboard */
  name?: string;
  /** Optional description of the dashboard */
  description?: string | null;
}) => {
  return await mainApi.post<GetDashboardResponse>('/dashboards', params).then((res) => res.data);
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
  return await mainApiV2
    .put<GetDashboardResponse>(`/dashboards/${params.id}`, params)
    .then((res) => res.data);
};

export const dashboardsDeleteDashboard = async (data: { ids: string[] }) => {
  return await mainApi.delete<null>('/dashboards', { data }).then((res) => res.data);
};

// share dashboards

export const shareDashboard = async ({ id, params }: { id: string; params: SharePostRequest }) => {
  return mainApiV2
    .post<SharePostResponse>(`/dashboards/${id}/sharing`, params)
    .then((res) => res.data);
};

export const unshareDashboard = async ({ id, data }: { id: string; data: ShareDeleteRequest }) => {
  return mainApiV2
    .delete<ShareDeleteResponse>(`/dashboards/${id}/sharing`, { data })
    .then((res) => res.data);
};

export const updateDashboardShare = async ({
  params,
  id,
}: {
  id: string;
  params: ShareUpdateRequest;
}) => {
  return mainApiV2
    .put<GetDashboardResponse>(`/dashboards/${id}/sharing`, params)
    .then((res) => res.data);
};
