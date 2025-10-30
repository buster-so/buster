import type { GetApiKeyResponse, GetApiKeysResponse } from '@buster/server-shared/api';
import { queryOptions } from '@tanstack/react-query';

export const apiKeysQueryKeys = {
  list: queryOptions<GetApiKeysResponse>({
    queryKey: ['api_keys'],
  }),
  get: (id: string) =>
    queryOptions<GetApiKeyResponse>({
      queryKey: ['api_keys', id],
    }),
};
