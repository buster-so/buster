import type { GetGitHubIntegrationResponse } from '@buster/server-shared/github';
import { mainApiV2 } from '../instances';

export const getGitHubIntegration = async (): Promise<GetGitHubIntegrationResponse> => {
  return await mainApiV2.get('/github/app').then((res) => res.data);
};

export const initiateGitHubAppInstall = async (): Promise<void> => {
  return await mainApiV2.post('/github/app/install').then((res) => res.data);
};
