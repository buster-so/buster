import { useMutation, useQueryClient } from '@tanstack/react-query';
import { libraryQueryKeys } from '@/api/query_keys/library';
import { searchQueryKeys } from '@/api/query_keys/search';
import { deleteLibraryAssets, postLibraryAssets } from './requests';

export const usePostLibraryAssets = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postLibraryAssets,
    onMutate: () => {},
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: libraryQueryKeys.libraryGetList({ page: 1, page_size: 10 }).queryKey.slice(0, 2),
        refetchType: 'all',
      });
      queryClient.invalidateQueries({
        queryKey: searchQueryKeys
          .getSearchResultInfinite({ page: 1, page_size: 25 })
          .queryKey.slice(0, 2),
        refetchType: 'all',
      });
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
        .queryKey.slice(0, 2);
      queryClient.invalidateQueries({ queryKey, refetchType: 'all' });
    },
  });
};
