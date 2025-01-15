import { BASE_URL } from '@/api/buster-rest/instances';
import { BusterUserResponse } from './interfaces';
import { mainApi } from '../instances';
import { serverFetch } from '../../createServerInstance';

export const getUserInfo = async ({
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

export const getUser = async ({ userId }: { userId: string }): Promise<BusterUserResponse> => {
  return mainApi.get(`/users/${userId}`).then((response) => response.data);
};
