import type { ListShortcutsResponse, Shortcut } from '@buster/server-shared/shortcuts';
import {
  type QueryClient,
  type UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { shortcutsQueryKeys } from '@/api/query_keys/shortcuts';
import { useBusterNotifications } from '@/context/BusterNotifications';
import type { ApiError } from '../../errors';
import {
  createShortcut,
  deleteShortcut,
  getShortcut,
  listShortcuts,
  updateShortcut,
} from './requests';

export const useListShortcuts = <TData = ListShortcutsResponse>(
  props?: Omit<UseQueryOptions<ListShortcutsResponse, ApiError, TData>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    ...shortcutsQueryKeys.shortcutsGetList,
    queryFn: listShortcuts,
    select: props?.select,
    ...props,
    initialData: { shortcuts: [] },
  });
};

export const prefetchListShortcuts = async (queryClient: QueryClient) => {
  await queryClient.prefetchQuery({
    ...shortcutsQueryKeys.shortcutsGetList,
    queryFn: listShortcuts,
  });
  return queryClient.getQueryData(shortcutsQueryKeys.shortcutsGetList.queryKey);
};

export const useGetShortcut = (params: Parameters<typeof getShortcut>[0]) => {
  const queryFn = () => getShortcut(params);
  return useQuery({
    ...shortcutsQueryKeys.shortcutsGet(params.id),
    queryFn,
    enabled: !!params.id,
  });
};

export const prefetchGetShortcut = async (id: string, queryClient: QueryClient) => {
  await queryClient.prefetchQuery({
    ...shortcutsQueryKeys.shortcutsGet(id),
    queryFn: () => getShortcut({ id }),
  });
  return queryClient.getQueryData(shortcutsQueryKeys.shortcutsGet(id).queryKey);
};

export const useCreateShortcut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createShortcut,
    onSuccess: (newShortcut) => {
      // Add the new shortcut to the list cache
      queryClient.setQueryData(
        shortcutsQueryKeys.shortcutsGetList.queryKey,
        (oldData: ListShortcutsResponse | undefined) => {
          if (!oldData) return { shortcuts: [newShortcut] };
          return { shortcuts: [newShortcut, ...oldData.shortcuts] };
        }
      );

      // Set the individual shortcut cache
      queryClient.setQueryData(
        shortcutsQueryKeys.shortcutsGet(newShortcut.id).queryKey,
        newShortcut
      );

      queryClient.invalidateQueries({
        queryKey: shortcutsQueryKeys.shortcutsGetList.queryKey,
      });
    },
  });
};

export const useUpdateShortcut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateShortcut,
    onMutate: async (params) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({
        queryKey: shortcutsQueryKeys.shortcutsGet(params.id).queryKey,
      });
      await queryClient.cancelQueries({ queryKey: shortcutsQueryKeys.shortcutsGetList.queryKey });

      // Snapshot the previous values
      const previousShortcut = queryClient.getQueryData(
        shortcutsQueryKeys.shortcutsGet(params.id).queryKey
      );
      const previousShortcuts = queryClient.getQueryData(
        shortcutsQueryKeys.shortcutsGetList.queryKey
      );

      // Optimistically update the individual shortcut cache
      queryClient.setQueryData(
        shortcutsQueryKeys.shortcutsGet(params.id).queryKey,
        (old: Shortcut | undefined) => {
          if (!old) return old;
          return {
            ...old,
            ...params,
            updatedAt: new Date().toISOString(), // Optimistic timestamp
          };
        }
      );

      // Optimistically update the shortcuts list cache
      queryClient.setQueryData(
        shortcutsQueryKeys.shortcutsGetList.queryKey,
        (oldData: ListShortcutsResponse | undefined) => {
          if (!oldData) return oldData;
          return {
            shortcuts: oldData.shortcuts.map((shortcut) =>
              shortcut.id === params.id
                ? {
                    ...shortcut,
                    ...params,
                    updatedAt: new Date().toISOString(), // Optimistic timestamp
                  }
                : shortcut
            ),
          };
        }
      );

      // Return a context object with the snapshotted values
      return { previousShortcut, previousShortcuts };
    },
    onSuccess: (updatedShortcut) => {
      // Update with the real data from server
      queryClient.setQueryData(
        shortcutsQueryKeys.shortcutsGet(updatedShortcut.id).queryKey,
        updatedShortcut
      );

      queryClient.setQueryData(
        shortcutsQueryKeys.shortcutsGetList.queryKey,
        (oldData: ListShortcutsResponse | undefined) => {
          if (!oldData) return oldData;
          return {
            shortcuts: oldData.shortcuts.map((shortcut) =>
              shortcut.id === updatedShortcut.id ? updatedShortcut : shortcut
            ),
          };
        }
      );
    },
    onError: (_error, params, context) => {
      // Revert the optimistic updates if the mutation fails
      if (context?.previousShortcut) {
        queryClient.setQueryData(
          shortcutsQueryKeys.shortcutsGet(params.id).queryKey,
          context.previousShortcut
        );
      }
      if (context?.previousShortcuts) {
        queryClient.setQueryData(
          shortcutsQueryKeys.shortcutsGetList.queryKey,
          context.previousShortcuts
        );
      }
    },
  });
};

export const useDeleteShortcut = (useConfirmModal = true) => {
  const queryClient = useQueryClient();
  const { openConfirmModal } = useBusterNotifications();

  const mutationFn = async (params: Parameters<typeof deleteShortcut>[0]) => {
    const method = async () => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({
        queryKey: shortcutsQueryKeys.shortcutsGet(params.id).queryKey,
      });
      await queryClient.cancelQueries({ queryKey: shortcutsQueryKeys.shortcutsGetList.queryKey });

      // Snapshot the previous values
      const previousShortcut = queryClient.getQueryData(
        shortcutsQueryKeys.shortcutsGet(params.id).queryKey
      );
      const previousShortcuts = queryClient.getQueryData(
        shortcutsQueryKeys.shortcutsGetList.queryKey
      );

      // Optimistically remove the shortcut from the list cache
      queryClient.setQueryData(
        shortcutsQueryKeys.shortcutsGetList.queryKey,
        (oldData: ListShortcutsResponse | undefined) => {
          if (!oldData) return oldData;
          return {
            shortcuts: oldData.shortcuts.filter((shortcut) => shortcut.id !== params.id),
          };
        }
      );

      // Optimistically remove the individual shortcut cache
      queryClient.removeQueries({
        queryKey: shortcutsQueryKeys.shortcutsGet(params.id).queryKey,
      });

      await deleteShortcut(params);
    };

    if (useConfirmModal) {
      return openConfirmModal({
        title: 'Delete shortcut',
        content: 'Are you sure you want to delete this shortcut?',
        onOk: method,
      });
    }
    return method();
  };

  return useMutation({
    mutationFn: mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: shortcutsQueryKeys.shortcutsGetList.queryKey,
      });
    },
  });
};
