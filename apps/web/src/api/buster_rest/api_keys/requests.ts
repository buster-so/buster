import type {
  BusterApiKeyListItem,
  CreateApiKeyResponse,
  DeleteApiKeyResponse,
  GetApiKeysResponse,
} from '@buster/server-shared/api';
import { mainApiV2 } from '../instances';

// Get API Keys
export const getApiKeys = async (): Promise<GetApiKeysResponse> => {
  const response = await mainApiV2.get('/api_keys');
  return response.data;
};

// Create API Key
export const createApiKey = async (name?: string): Promise<CreateApiKeyResponse> => {
  const response = await mainApiV2.post('/api_keys', { name });
  return response.data;
};

// Delete API Key
export const deleteApiKey = async (id: string): Promise<DeleteApiKeyResponse> => {
  const response = await mainApiV2.delete(`/api_keys/${id}`);
  return response.data;
};

// Get Single API Key
export const getApiKey = async (id: string): Promise<BusterApiKeyListItem> => {
  const response = await mainApiV2.get(`/api_keys/${id}`);
  return response.data;
};
