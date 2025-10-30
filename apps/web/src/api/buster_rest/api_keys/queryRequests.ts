import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiKeysQueryKeys } from '@/api/query_keys/api_keys';
import { createApiKey, deleteApiKey, getApiKey, getApiKeys } from './requests';

export const useGetApiKeys = () => {
  return useQuery({
    ...apiKeysQueryKeys.list,
    queryFn: getApiKeys,
    refetchOnWindowFocus: false,
  });
};

export const prefetchApiKeys = async (queryClient: QueryClient) => {
  await queryClient.prefetchQuery({
    ...apiKeysQueryKeys.list,
    queryFn: getApiKeys,
  });
};

export const useCreateApiKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ ...apiKeysQueryKeys.list });
    },
  });
};

export const useDeleteApiKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ ...apiKeysQueryKeys.list });
    },
  });
};

export const useGetApiKey = (id: string) => {
  return useQuery({
    ...apiKeysQueryKeys.get(id),
    queryFn: () => getApiKey(id),
  });
};
