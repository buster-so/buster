import { useCreateReactQuery, useCreateReactMutation } from '@/api/createReactQuery';
import {
  getPermissionGroup,
  createPermissionGroup,
  deletePermissionGroup,
  listAllPermissionGroups,
  updatePermissionGroups
} from './requests';
import { useMemoizedFn } from 'ahooks';
import { useQueryClient } from '@tanstack/react-query';
import { GetPermissionGroupResponse } from './responseInterfaces';
import isEmpty from 'lodash/isEmpty';
import { PERMISSION_GROUP_QUERY_KEY } from './config';
import { ListPermissionGroupsResponse, updateDatasetPermissionGroups } from '../datasets';

export const useListAllPermissionGroups = () => {
  return useCreateReactQuery({
    queryKey: ['permission_groups'],
    queryFn: listAllPermissionGroups
  });
};

export const useCreatePermissionGroup = () => {
  const queryClient = useQueryClient();

  const mutationFn = useMemoizedFn(
    async ({
      name,
      dataset_id
    }: Parameters<typeof createPermissionGroup>[0] & { dataset_id?: string }) => {
      const res = await createPermissionGroup({ name });

      if (dataset_id && res?.id) {
        await updateDatasetPermissionGroups({
          dataset_id,
          groups: [{ id: res.id, assigned: true }]
        });
      }

      queryClient.setQueryData(
        [PERMISSION_GROUP_QUERY_KEY],
        (oldData: GetPermissionGroupResponse[]) => (isEmpty(oldData) ? [res] : [...oldData, res])
      );

      if (dataset_id) {
        queryClient.setQueryData(
          [PERMISSION_GROUP_QUERY_KEY, dataset_id],
          (oldData: ListPermissionGroupsResponse[]) => {
            const newItem: ListPermissionGroupsResponse = {
              id: res.id,
              name: res.name,
              assigned: !!dataset_id
            };
            if (isEmpty(oldData)) {
              return [newItem];
            }
            return [...oldData, newItem];
          }
        );
      }

      return res;
    }
  );

  return useCreateReactMutation({
    mutationFn
  });
};

export const useGetPermissionGroup = (permissionGroupId: string) => {
  const queryFn = useMemoizedFn(() => getPermissionGroup({ id: permissionGroupId }));
  return useCreateReactQuery({
    queryKey: ['permission_group', permissionGroupId],
    queryFn
  });
};

export const useDeletePermissionGroup = () => {
  const queryClient = useQueryClient();
  return useCreateReactMutation({
    mutationFn: deletePermissionGroup,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['permission_groups'] });
      //TODO delete the permission group from the dataset
    }
  });
};

export const useUpdatePermissionGroup = () => {
  const queryClient = useQueryClient();
  return useCreateReactMutation({
    mutationFn: updatePermissionGroups,
    onSuccess: (data, varaiables, context) => {
      // TODO update the permission group in the dataset
    }
  });
};
