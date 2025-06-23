import axios from 'axios';

export const checkTokenValidityFromServer = async (d?: {
  accessToken: string;
  preemptiveRefreshMinutes: number;
}) => {
  return await axios
    .post<{
      isTokenValid: boolean;
      access_token: string;
      expires_at: number;
      refresh_token: string | null;
    }>(
      '/api/auth/refresh',
      {
        preemptiveRefreshMinutes: d?.preemptiveRefreshMinutes
      },
      {
        headers: {
          Authorization: `Bearer ${d?.accessToken}`
        }
      }
    )
    .then((res) => res.data);
};
