import { BASE_URL } from '@/api/buster_rest/instances';
import { BusterUserResponse } from './interfaces';
import { mainApi } from '../instances';
import { serverFetch } from '../../createServerInstance';
import { OrganizationUser } from '../organizations';

export const getMyUserInfo = async ({
  jwtToken
}: {
  jwtToken: string | undefined;
}): Promise<BusterUserResponse | undefined> => {
  if (!jwtToken) {
    const res = await serverFetch<BusterUserResponse>(`/users`, {
      method: 'GET'
    });
    return res;
  }

  //use fetch instead of serverFetch because...
  return fetch(`${BASE_URL}/users`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwtToken}`
    }
  })
    .then((response) => {
      return response.json();
    })
    .catch((error) => {
      return undefined;
    });
};

export const getUser = async ({ userId }: { userId: string }) => {
  return mainApi.get<OrganizationUser>(`/users/${userId}`).then((response) => response.data);
};

export const getUser_server = async ({ userId }: { userId: string }) => {
  return serverFetch<BusterUserResponse>(`/users/${userId}`);
};

export const updateOrganizationUser = async ({
  userId,
  ...params
}: {
  userId: string;
  name?: string;
  role: OrganizationUser['role'];
}) => {
  return mainApi
    .put<OrganizationUser>(`/users/${userId}`, params)
    .then((response) => response.data);
};
