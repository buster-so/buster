import { queryKeys } from '@/api/query_keys';
import { useMemoizedFn } from '@/hooks';
import { useMutation, useQuery } from '@tanstack/react-query';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import {
  getUserAttributes,
  getUserAttributes_server,
  getUserDatasetGroups,
  getUserDatasetGroups_server,
  getUserDatasets,
  getUserDatasets_server,
  getUserPermissionGroups,
  getUserPermissionGroups_server,
  getUserTeams,
  getUserTeams_server,
  updateUserDatasetGroups,
  updateUserDatasets,
  updateUserPermissionGroups,
  updateUserTeams
} from './requests';

export const useGetUserDatasetGroups = ({ userId }: { userId: string }) => {
  const queryFn = useMemoizedFn(async () => getUserDatasetGroups({ userId }));
  return useQuery({
    ...queryKeys.userGetUserDatasetGroups(userId),
    queryFn
  });
};

export const prefetchGetUserDatasetGroups = async (
  userId: string,
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    ...queryKeys.userGetUserDatasetGroups(userId),
    queryFn: () => getUserDatasetGroups_server({ userId })
  });
  return queryClient;
};

export const useGetUserDatasets = ({ userId }: { userId: string }) => {
  const queryFn = useMemoizedFn(async () => getUserDatasets({ userId }));
  return useQuery({
    ...queryKeys.userGetUserDatasets(userId),
    queryFn
  });
};

export const prefetchGetUserDatasets = async (userId: string, queryClientProp?: QueryClient) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    ...queryKeys.userGetUserDatasets(userId),
    queryFn: () => getUserDatasets_server({ userId })
  });
  return queryClient;
};

export const useGetUserAttributes = ({ userId }: { userId: string }) => {
  const queryFn = useMemoizedFn(async () => getUserAttributes({ userId }));
  return useQuery({
    ...queryKeys.userGetUserAttributes(userId),
    queryFn
  });
};

export const prefetchGetUserAttributes = async (userId: string, queryClientProp?: QueryClient) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    ...queryKeys.userGetUserAttributes(userId),
    queryFn: () => getUserAttributes_server({ userId })
  });
  return queryClient;
};

export const useGetUserTeams = ({ userId }: { userId: string }) => {
  const queryFn = useMemoizedFn(async () => getUserTeams({ userId }));
  return useQuery({
    ...queryKeys.userGetUserTeams(userId),
    queryFn
  });
};

export const prefetchGetUserTeams = async (userId: string, queryClientProp?: QueryClient) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    ...queryKeys.userGetUserTeams(userId),
    queryFn: () => getUserTeams_server({ userId })
  });
  return queryClient;
};

export const useGetUserPermissionGroups = ({ userId }: { userId: string }) => {
  const queryFn = useMemoizedFn(async () => getUserPermissionGroups({ userId }));
  return useQuery({
    ...queryKeys.userGetUserPermissionsGroups(userId),
    queryFn
  });
};

export const prefetchGetUserPermissionGroups = async (
  userId: string,
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    ...queryKeys.userGetUserPermissionsGroups(userId),
    queryFn: () => getUserPermissionGroups_server({ userId })
  });
  return queryClient;
};

export const useUpdateUserTeams = ({ userId }: { userId: string }) => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn(async (teams: Parameters<typeof updateUserTeams>[1]) => {
    const options = queryKeys.userGetUserTeams(userId);
    const queryKey = options.queryKey;
    queryClient.setQueryData(queryKey, (oldData) => {
      return (oldData || []).map((oldTeam) => {
        const updatedTeam = teams.find((t) => t.id === oldTeam.id);
        if (updatedTeam) return { ...oldTeam, role: updatedTeam.role };
        return oldTeam;
      });
    });
    const result = await updateUserTeams(userId, teams);

    return result;
  });
  return useMutation({
    mutationFn
  });
};

export const useUpdateUserPermissionGroups = ({ userId }: { userId: string }) => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn(
    async (permissionGroups: Parameters<typeof updateUserPermissionGroups>[1]) => {
      const options = queryKeys.userGetUserPermissionsGroups(userId);
      const queryKey = options.queryKey;
      queryClient.setQueryData(queryKey, (oldData) => {
        return (oldData || []).map((oldGroup) => {
          const updatedGroup = permissionGroups.find((pg) => pg.id === oldGroup.id);
          if (updatedGroup) return { ...oldGroup, assigned: updatedGroup.assigned };
          return oldGroup;
        });
      });
      const result = await updateUserPermissionGroups(userId, permissionGroups);
      return result;
    }
  );
  return useMutation({
    mutationFn
  });
};

export const useUpdateUserDatasetGroups = ({ userId }: { userId: string }) => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn(
    async (datasetGroups: Parameters<typeof updateUserDatasetGroups>[1]) => {
      const options = queryKeys.userGetUserDatasetGroups(userId);
      const queryKey = options.queryKey;
      queryClient.setQueryData(queryKey, (oldData) => {
        return (oldData || []).map((oldGroup) => {
          const updatedGroup = datasetGroups.find((pg) => pg.id === oldGroup.id);
          if (updatedGroup) return { ...oldGroup, assigned: updatedGroup.assigned };
          return oldGroup;
        });
      });
      const result = await updateUserDatasetGroups(userId, datasetGroups);
      return result;
    }
  );
  return useMutation({
    mutationFn
  });
};

export const useUpdateUserDatasets = ({ userId }: { userId: string }) => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn(async (datasets: Parameters<typeof updateUserDatasets>[1]) => {
    const options = queryKeys.userGetUserDatasets(userId);
    const queryKey = options.queryKey;
    queryClient.setQueryData(queryKey, (oldData) => {
      return (oldData || []).map((oldDataset) => {
        const updatedDataset = datasets.find((d) => d.id === oldDataset.id);
        if (updatedDataset) return { ...oldDataset, assigned: updatedDataset.assigned };
        return oldDataset;
      });
    });
    const result = await updateUserDatasets(userId, datasets);
    return result;
  });
  return useMutation({ mutationFn });
};
