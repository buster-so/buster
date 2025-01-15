import mainApi, { BASE_URL } from '@/api/buster-rest/instances';
import { BusterApiKeyListItem } from './interfaces';

export const getApiKeys = async (): Promise<{
  api_keys: BusterApiKeyListItem[];
}> => {
  return mainApi.get(`/api_keys`).then((res) => res.data);
};

export const createApiKey = async (
  name: string
): Promise<{
  api_key: string;
}> => {
  return mainApi.post(`/api_keys`, { name }).then((res) => res.data);
};

export const deleteApiKey = async (id: string): Promise<void> => {
  return mainApi.delete(`/api_keys/${id}`).then(() => {});
};

export const getApiKey = async (id: string): Promise<BusterApiKeyListItem> => {
  return mainApi.get(`/api_keys/${id}`).then((res) => res.data);
};
