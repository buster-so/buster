import type {
  BusterUserAttribute,
  BusterUserDataset,
  BusterUserDatasetGroup,
  BusterUserFavorite,
  BusterUserListItem,
  BusterUserPermissionGroup,
  BusterUserResponse,
  BusterUserTeamListItem,
  OrganizationUser
} from '@/api/asset_interfaces/users';
import { queryOptions } from '@tanstack/react-query';
import type { getUserList } from '../buster_rest/users/requests';

const favoritesGetList = queryOptions<BusterUserFavorite[]>({
  queryKey: ['myself', 'list', 'favorites'] as const,
  staleTime: 1000 * 60 * 60, // 1 hour,
  initialData: [],
  initialDataUpdatedAt: 0
});

const userGetUserMyself = queryOptions<BusterUserResponse | null>({
  queryKey: ['myself'] as const,
  staleTime: 1000 * 60 * 60 // 1 hour
});

const userGetUser = (userId: string) =>
  queryOptions<OrganizationUser>({
    queryKey: ['users', userId, 'organization'] as const
  });

const userGetUserPermissionsGroups = (userId: string) =>
  queryOptions<BusterUserPermissionGroup[]>({
    queryKey: ['users', userId, 'permissionsGroups'] as const
  });

const userGetUserTeams = (userId: string) =>
  queryOptions<BusterUserTeamListItem[]>({
    queryKey: ['users', userId, 'teams'] as const
  });

const userGetUserAttributes = (userId: string) =>
  queryOptions<BusterUserAttribute[]>({
    queryKey: ['users', userId, 'attributes'] as const
  });

const userGetUserDatasets = (userId: string) =>
  queryOptions<BusterUserDataset[]>({
    queryKey: ['users', userId, 'datasets'] as const
  });

const userGetUserDatasetGroups = (userId: string) =>
  queryOptions<BusterUserDatasetGroup[]>({
    queryKey: ['users', userId, 'datasetGroups'] as const
  });

const userGetUserList = (params: Parameters<typeof getUserList>[0]) =>
  queryOptions<BusterUserListItem[]>({
    queryKey: ['users', 'list', params] as const
  });

export const userQueryKeys = {
  favoritesGetList,
  userGetUserMyself,
  userGetUser,
  userGetUserPermissionsGroups,
  userGetUserTeams,
  userGetUserAttributes,
  userGetUserDatasets,
  userGetUserDatasetGroups,
  userGetUserList
};
