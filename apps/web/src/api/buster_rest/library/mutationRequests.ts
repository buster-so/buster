import { useMutation, useQueryClient } from '@tanstack/react-query';
import { libraryQueryKeys } from '@/api/query_keys/library';
import { deleteLibraryAssets, postLibraryAssets } from './requests';

export const usePostLibraryAssets = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postLibraryAssets,
    onSuccess: () => {
      const queryKey = libraryQueryKeys
        .libraryGetList({ page: 1, page_size: 10 })
        .queryKey.slice(0, 3);
      queryClient.invalidateQueries({ queryKey, refetchType: 'all' });
    },
  });
};

export const useDeleteLibraryAssets = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteLibraryAssets,
    onSuccess: () => {
      const queryKey = libraryQueryKeys
        .libraryGetList({ page: 1, page_size: 10 })
        .queryKey.slice(0, 3);
      queryClient.invalidateQueries({ queryKey, refetchType: 'all' });
    },
  });
};
