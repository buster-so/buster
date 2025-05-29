import { userQueryKeys } from '@/api/query_keys/users';
import { useUserConfigContextSelector } from '@/context/Users/BusterUserConfigProvider';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createUserFavorite,
  deleteUserFavorite,
  getUserFavorites,
  getUserFavorites_server,
  updateUserFavorites
} from './requests';

export const useGetUserFavorites = () => {
  const queryFn = useMemoizedFn(async () => getUserFavorites());
  const organizationId = useUserConfigContextSelector((state) => state.userOrganizations?.id);
  return useQuery({
    ...userQueryKeys.favoritesGetList,
    queryFn,
    enabled: !!organizationId
  });
};

export const prefetchGetUserFavorites = async (queryClientProp?: QueryClient) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    ...userQueryKeys.favoritesGetList,
    queryFn: () => getUserFavorites_server()
  });
  return queryClient;
};

export const useAddUserFavorite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUserFavorite,
    onMutate: (params) => {
      queryClient.setQueryData(userQueryKeys.favoritesGetList.queryKey, (prev) => {
        const prevIds = prev?.map((p) => p.id) || [];
        const dedupedAdd = params.filter((p) => !prevIds.includes(p.id));
        return [...dedupedAdd, ...(prev || [])];
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(userQueryKeys.favoritesGetList.queryKey, data);
    }
  });
};

export const useDeleteUserFavorite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUserFavorite,
    onMutate: (id) => {
      queryClient.setQueryData(userQueryKeys.favoritesGetList.queryKey, (prev) => {
        return prev?.filter((fav) => !id.includes(fav.id));
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(userQueryKeys.favoritesGetList.queryKey, data);
    }
  });
};

export const useUpdateUserFavorites = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserFavorites,
    onMutate: (params) => {
      queryClient.setQueryData(userQueryKeys.favoritesGetList.queryKey, (prev) => {
        return prev?.filter((fav, index) => {
          const id = fav.id;
          const favorite = (prev || []).find((f) => f.id === id);
          if (!favorite) return false;
          return { ...favorite, index };
        });
      });
    }
  });
};
