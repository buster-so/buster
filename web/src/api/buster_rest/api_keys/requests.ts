import mainApi from '@/api/buster_rest/instances';
import {
  BusterApiKeyListItemSchema,
  GetApiKeysResponseSchema,
  CreateApiKeyResponseSchema
} from '@/api/asset_interfaces/api_keys';

// Get API Keys
export const getApiKeys = async () => {
  const response = await mainApi.get('/api_keys');
  const result = GetApiKeysResponseSchema.safeParse(response.data);

  if (!result.success) {
    console.error('API Keys validation error:', result.error.issues);
    throw new Error(
      `Invalid API response format for getApiKeys: ${result.error.issues.map((e) => e.message).join(', ')}`
    );
  }

  return result.data;
};

// Create API Key

export const createApiKey = async (name: string) => {
  const response = await mainApi.post('/api_keys', { name });
  const result = CreateApiKeyResponseSchema.safeParse(response.data);

  if (!result.success) {
    console.error('Create API Key validation error:', result.error.issues);
    throw new Error(
      `Invalid API response format for createApiKey: ${result.error.issues.map((e) => e.message).join(', ')}`
    );
  }

  return result.data;
};

// Delete API Key
export const deleteApiKey = async (id: string) => {
  const response = await mainApi.delete(`/api_keys/${id}`);
  return response.data;
};

// Get Single API Key
export const getApiKey = async (id: string) => {
  const response = await mainApi.get(`/api_keys/${id}`);
  const result = BusterApiKeyListItemSchema.safeParse(response.data);

  if (!result.success) {
    console.error('Get API Key validation error:', result.error.issues);
    throw new Error(
      `Invalid API response format for getApiKey: ${result.error.issues.map((e) => e.message).join(', ')}`
    );
  }

  return result.data;
};
