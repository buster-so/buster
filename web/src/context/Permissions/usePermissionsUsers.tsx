import { PermissionsListUsersRequest } from '@/api/buster-socket/permissions';
import { BusterPermissionListUser } from '@/api/buster-rest/permissions';
import { useMemoizedFn } from 'ahooks';
import React, { useEffect, useMemo } from 'react';
import { useBusterWebSocket } from '../BusterWebSocket';
import { usePermissionsContextSelector } from './PermissionsConfigProvider';

export const usePermissionUsers = () => {
  const busterSocket = useBusterWebSocket();
  const [usersList, setUsersList] = React.useState<Record<string, BusterPermissionListUser[]>>({});
  const [loadedUsersList, setLoadedUsersList] = React.useState(false);

  const _onInitUsersList = useMemoizedFn(
    (
      users: BusterPermissionListUser[],
      filters: Omit<PermissionsListUsersRequest['payload'], 'page' | 'page_size'> = {}
    ) => {
      const key = JSON.stringify(filters);
      setUsersList((prev) => ({ ...prev, [key]: users }));
      setLoadedUsersList(true);
    }
  );

  const initPermissionUsersList = useMemoizedFn(
    async (filters: Omit<PermissionsListUsersRequest['payload'], 'page' | 'page_size'> = {}) => {
      const res = await busterSocket.emitAndOnce({
        emitEvent: {
          route: '/permissions/users/list',
          payload: {
            page: 0,
            page_size: 1000,
            ...filters
          }
        },
        responseEvent: {
          route: '/permissions/users/list:listUserPermissions',
          callback: (v) => {
            _onInitUsersList(v, filters);
          }
        }
      });
      return res as BusterPermissionListUser[];
    }
  );

  return {
    loadedUsersList,
    usersList,
    initPermissionUsersList
  };
};

export const usePermissionUsersIndividual = (
  filters: Omit<PermissionsListUsersRequest['payload'], 'page' | 'page_size'> = {}
) => {
  const usersList = usePermissionsContextSelector((x) => x.usersList);
  const initPermissionUsersList = usePermissionsContextSelector((x) => x.initPermissionUsersList);
  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    initPermissionUsersList(filters);
  }, [initPermissionUsersList, filterKey]);

  return usersList[filterKey] || [];
};
