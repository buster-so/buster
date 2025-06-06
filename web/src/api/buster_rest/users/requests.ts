import type { ShareAssetType } from '@/api/asset_interfaces/share';
import type {
  BusterUserFavorite,
  BusterUserListItem,
  BusterUserResponse,
  OrganizationUser
} from '@/api/asset_interfaces/users';
import { BASE_URL } from '@/api/buster_rest/config';
import { serverFetch } from '../../createServerInstance';
import { mainApi } from '../instances';

export const getMyUserInfo = async (): Promise<BusterUserResponse> => {
  return mainApi.get<BusterUserResponse>('/users').then((response) => response.data);
};

export const getMyUserInfo_server = async ({
  jwtToken
}: {
  jwtToken: string | undefined;
}): Promise<BusterUserResponse | null> => {
  if (!jwtToken) {
    //If Anonymous user, it will fail, so we catch the error and return undefined
    return await serverFetch<BusterUserResponse>('/users', {
      method: 'GET'
    });
  }

  //use fetch instead of serverFetch because...
  return fetch(`${BASE_URL}/users`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwtToken}`
    }
  }).then(async (response) => {
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw {
        status: response.status,
        statusText: response.statusText,
        ...errorData
      };
    }
    return response.json();
  });
};

export const getUser = async ({ userId }: { userId: string }) => {
  return mainApi.get<OrganizationUser>(`/users/${userId}`).then((response) => response.data);
};

export const getUser_server = async ({ userId }: { userId: string }) => {
  return serverFetch<OrganizationUser>(`/users/${userId}`);
};

export const updateOrganizationUser = async ({
  userId,
  ...params
}: {
  userId: string;
  name?: string;
  role?: OrganizationUser['role'];
}) => {
  return mainApi
    .put<OrganizationUser>(`/users/${userId}`, params)
    .then((response) => response.data);
};

export const inviteUser = async ({
  emails,
  team_ids
}: {
  emails: string[];
  team_ids?: string[];
}) => {
  return mainApi.post<null>('/users/invite', {
    emails,
    team_ids
  });
};

//USER FAVORITES

export const getUserFavorites = async () => {
  return mainApi.get<BusterUserFavorite[]>('/users/favorites').then((response) => response.data);
};

export const getUserFavorites_server = async () => {
  return serverFetch<BusterUserFavorite[]>('/users/favorites');
};

export const createUserFavorite = async (
  payload: {
    id: string;
    asset_type: ShareAssetType;
    index?: number;
    name: string; //just used for the UI for optimistic update
  }[]
) => {
  return mainApi
    .post<BusterUserFavorite[]>('/users/favorites', payload)
    .then((response) => response.data);
};

export const deleteUserFavorite = async (data: string[]) => {
  return mainApi
    .delete<BusterUserFavorite[]>('/users/favorites', { data })
    .then((response) => response.data);
};

export const updateUserFavorites = async (payload: string[]) => {
  return mainApi
    .put<BusterUserFavorite[]>('/users/favorites', payload)
    .then((response) => response.data);
};

//USER LIST

export const getUserList = async (payload: {
  team_id: string;
  page?: number;
  page_size?: number;
}) => {
  return mainApi
    .get<BusterUserListItem[]>('/users', { params: payload })
    .then((response) => response.data);
};

export const getUserList_server = async (payload: Parameters<typeof getUserList>[0]) => {
  return serverFetch<BusterUserListItem[]>('/users', { params: payload });
};
