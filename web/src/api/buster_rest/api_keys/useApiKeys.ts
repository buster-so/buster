'use client';

import { useCreateReactMutation, useCreateReactQuery } from '@/api/createReactQuery';
import { createApiKey, deleteApiKey, getApiKey, getApiKeys } from './requests';
import { useQueryClient } from '@tanstack/react-query';

export const useGetApiKeys = () => {
  return useCreateReactQuery({
    queryKey: ['api_keys'],
    queryFn: getApiKeys,
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });
};

export const useCreateApiKey = () => {
  const queryClient = useQueryClient();

  return useCreateReactMutation({
    mutationFn: createApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api_keys'] });
    }
  });
};

export const useDeleteApiKey = () => {
  const queryClient = useQueryClient();

  return useCreateReactMutation({
    mutationFn: deleteApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api_keys'] });
    }
  });
};

export const useGetApiKey = (id: string) => {
  return useCreateReactQuery({
    queryKey: ['api_key', id],
    queryFn: () => getApiKey(id)
  });
};
