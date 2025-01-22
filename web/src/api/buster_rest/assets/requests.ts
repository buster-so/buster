import { BASE_URL } from '@/api/buster_rest/instances';
import { PublicAssetResponse } from './interface';

export const getAssetCheck = async ({
  type,
  id,
  jwtToken
}: {
  type: 'thread' | 'dashboard';
  id: string;
  jwtToken: string | undefined;
}): Promise<PublicAssetResponse> => {
  const data = fetch(`${BASE_URL}/assets/${type}/${id}`, {
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
      return {
        id: '',
        public: false,
        password_required: false,
        has_access: false
      };
    });

  return data;
};
