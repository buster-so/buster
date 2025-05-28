import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTerm, deleteTerms, getTerm, getTermsList, updateTerm } from './requests';
import { queryKeys } from '@/api/query_keys';
import type { BusterTerm } from '@/api/asset_interfaces/terms';
import { useMemo } from 'react';
import { useMemoizedFn } from '@/hooks';
import { useBusterNotifications } from '@/context/BusterNotifications';

export const useGetTermsList = (
  params?: Omit<Parameters<typeof getTermsList>[0], 'page_token' | 'page_size'>
) => {
  const compiledParams: Parameters<typeof getTermsList>[0] = useMemo(
    () => ({ page_token: 0, page_size: 3500, ...params }),
    [params]
  );

  return useQuery({
    ...queryKeys.termsGetList,
    queryFn: () => getTermsList(compiledParams)
  });
};

export const useGetTerm = (id: string | undefined) => {
  return useQuery({
    ...queryKeys.termsGetTerm(id || ''),
    queryFn: () => getTerm(id || ''),
    enabled: !!id
  });
};

export const useCreateTerm = () => {
  return useMutation({
    mutationFn: createTerm
  });
};

export const useUpdateTerm = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTerm,
    onMutate: (params) => {
      const options = queryKeys.termsGetTerm(params.id);
      const previousTerm = queryClient.getQueryData(options.queryKey);
      if (previousTerm) {
        const newTerm: BusterTerm = {
          ...previousTerm,
          ...params
        };
        queryClient.setQueryData(options.queryKey, newTerm);
      }
    }
  });
};

export const useDeleteTerm = () => {
  const queryClient = useQueryClient();
  const { openConfirmModal } = useBusterNotifications();
  const mutationFn = useMemoizedFn(
    async ({
      ids,
      ignoreConfirm = false
    }: Parameters<typeof deleteTerms>[0] & { ignoreConfirm?: boolean }) => {
      const method = async () => {
        await deleteTerms({ ids });
        const options = queryKeys.termsGetList;
        queryClient.invalidateQueries({ queryKey: options.queryKey });
      };

      if (ignoreConfirm) {
        return method();
      }

      return openConfirmModal({
        title: 'Delete term',
        content: 'Are you sure you want to delete this term?',
        onOk: method
      });
    }
  );

  return useMutation({
    mutationFn
  });
};
