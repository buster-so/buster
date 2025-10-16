import type { GetGitHubIntegrationResponse } from '@buster/server-shared/github';
import { mainApiV2 } from '../instances';

// GET /api/v2/github/app
export const getGitHubIntegration = async (): Promise<GetGitHubIntegrationResponse> => {
  return await mainApiV2.get('/github/app').then((res) => res.data);
};

// POST /api/v2/github/app/install
export const initiateGitHubAppInstall = async (): Promise<void> => {
  return await mainApiV2.post('/github/app/install').then((res) => res.data);
};

// DELETE /api/v2/github/app/install
export const removeGitHubIntegration = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  return await mainApiV2.delete('/github/app/install').then((res) => res.data);
};
