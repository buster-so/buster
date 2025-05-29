import { useMutation, useQuery } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { createApiKey, deleteApiKey, getApiKey, getApiKeys } from './requests';

export const useGetApiKeys = () => {
  return useQuery({
    queryKey: ['api_keys'],
    queryFn: getApiKeys,
    refetchOnWindowFocus: false
  });
};

export const useCreateApiKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api_keys'] });
    }
  });
};

export const useDeleteApiKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api_keys'] });
    }
  });
};

export const useGetApiKey = (id: string) => {
  return useQuery({
    queryKey: ['api_key', id],
    queryFn: () => getApiKey(id)
  });
};
