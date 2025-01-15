import axios from 'axios';

export const checkTokenValidityFromServer = async (d?: {
  accessToken: string;
}): Promise<{
  isTokenValid: boolean;
  access_token: string;
  expires_at: number;
  refresh_token: string | null;
}> => {
  return await axios
    .post('/api/auth', undefined, {
      headers: {
        Authorization: `Bearer ${d?.accessToken}`
      }
    })
    .then((res) => res.data);
};
