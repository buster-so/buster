import axios from 'axios';

export const checkTokenValidityFromServer = async (d?: { accessToken: string }) => {
  return await axios
    .post<{
      isTokenValid: boolean;
      access_token: string;
      expires_at: number;
      refresh_token: string | null;
    }>('/api/auth', undefined, {
      headers: {
        Authorization: `Bearer ${d?.accessToken}`
      }
    })
    .then((res) => res.data);
};
