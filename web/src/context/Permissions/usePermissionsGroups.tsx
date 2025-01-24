import { BusterPermissionListGroup } from '@/api/buster_rest/permissions';
import React, { useEffect, useMemo, useState } from 'react';
import { useBusterWebSocket } from '../BusterWebSocket';
import { useMemoizedFn } from 'ahooks';
import { PermissionsListGroupRequest } from '@/api/buster_socket/permissions';
import { useBusterNotifications } from '../BusterNotifications';
import { usePermissionsContextSelector } from './PermissionsConfigProvider';

export const usePermissionsGroups = () => {
  const { openConfirmModal } = useBusterNotifications();
  const busterSocket = useBusterWebSocket();
  const [permissionGroupsList, setPermissionGroupsList] = useState<
    Record<string, BusterPermissionListGroup[]>
  >({});
  const [openCreatePermissionGroupModal, setOpenCreatePermissionGroupModal] = useState(false);
  const [loadedGroupsList, setLoadedGroupsList] = useState(false);

  const _onInitPermissionGroupsList = useMemoizedFn(
    (
      groups: BusterPermissionListGroup[],
      filters: Omit<PermissionsListGroupRequest['payload'], 'page' | 'page_size'> = {}
    ) => {
      const key = JSON.stringify(filters);
      setPermissionGroupsList((prev) => ({ ...prev, [key]: groups }));
      setLoadedGroupsList(true);
    }
  );

  const initPermissionGroupsList = useMemoizedFn(
    async (filters: Omit<PermissionsListGroupRequest['payload'], 'page' | 'page_size'> = {}) => {
      const res = await busterSocket.emitAndOnce({
        emitEvent: {
          route: '/permissions/groups/list',
          payload: {
            page: 0,
            page_size: 2000,
            ...filters
          }
        },
        responseEvent: {
          route: '/permissions/groups/list:listPermissionGroups',
          callback: (v) => {
            _onInitPermissionGroupsList(v, filters);
          }
        }
      });
      return res as BusterPermissionListGroup[];
    }
  );

  const deletePermissionGroup = useMemoizedFn(async (ids: string[], ignoreConfirmation = false) => {
    const method = async () => {
      setPermissionGroupsList((prev) => {
        const newList = { ...prev };
        Object.keys(newList).forEach((filterKey) => {
          const permissionGroupIds = newList[filterKey]?.filter((x) => !ids.includes(x.id));
          newList[filterKey] = permissionGroupIds;
          if (permissionGroupIds?.length === 0) {
            delete newList[filterKey];
          }
        });
        return newList;
      });
      await busterSocket.emitAndOnce({
        emitEvent: {
          route: '/permissions/groups/delete',
          payload: {
            ids
          }
        },
        responseEvent: {
          route: '/permissions/groups/delete:deletePermissionGroup',
          callback: () => {}
        }
      });
    };

    if (ignoreConfirmation) {
      return method();
    }

    return await openConfirmModal({
      title: 'Delete Permission Group',
      content: 'Are you sure you want to delete these permission groups?',
      onOk: method
    });
  });

  return {
    permissionGroupsList,
    deletePermissionGroup,
    loadedGroupsList,
    initPermissionGroupsList,
    openCreatePermissionGroupModal,
    setOpenCreatePermissionGroupModal
  };
};

export const usePermissionGroupsListIndividual = (
  filters: Omit<PermissionsListGroupRequest['payload'], 'page' | 'page_size'> = {}
) => {
  const initPermissionGroupsList = usePermissionsContextSelector((x) => x.initPermissionGroupsList);
  const permissionGroupsList = usePermissionsContextSelector((x) => x.permissionGroupsList);
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    initPermissionGroupsList(filters);
  }, [initPermissionGroupsList, filtersKey]);

  return permissionGroupsList[filtersKey] || [];
};
