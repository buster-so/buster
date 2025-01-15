import React, { useState } from 'react';
import { useBusterWebSocket } from '../BusterWebSocket';
import { BusterDatasetListItem } from '@/api/buster-rest/datasets';
import { useMemoizedFn } from 'ahooks';
import { useUserConfigContextSelector } from '../Users';
import { usePermissionsContextSelector } from './PermissionsConfigProvider';

export const usePermissionDatasets = () => {
  const busterSocket = useBusterWebSocket();
  const isAdmin = useUserConfigContextSelector((state) => state.isAdmin);
  const [datasetListItems, setDatasetListItems] = useState<Record<string, BusterDatasetListItem[]>>(
    {}
  );

  const getDatasetListItems = useMemoizedFn((permissionGroupId: string) => {
    return datasetListItems[permissionGroupId] || [];
  });

  const _onInitDatasetListItems = useMemoizedFn(
    (datasets: BusterDatasetListItem[], permissionGroupId: string) => {
      setDatasetListItems((prev) => ({ ...prev, [permissionGroupId]: datasets }));
    }
  );

  const initDatasetListItems = useMemoizedFn(async (permissionGroupId: string) => {
    const res = await busterSocket.emitAndOnce({
      emitEvent: {
        route: '/datasets/list',
        payload: {
          page: 0,
          page_size: 1000,
          admin_view: isAdmin,
          permission_group_id: permissionGroupId
        }
      },
      responseEvent: {
        route: '/datasets/list:listDatasetsAdmin',
        callback: (v) => {
          _onInitDatasetListItems(v, permissionGroupId);
        }
      }
    });

    return res as BusterDatasetListItem[];
  });

  return {
    initDatasetListItems,
    getDatasetListItems,
    datasetListItems
  };
};

export const useDatasetListItemsIndividual = ({
  permissionGroupId
}: {
  permissionGroupId: string;
}) => {
  const datasetListItems = usePermissionsContextSelector((x) => x.datasetListItems);
  return datasetListItems[permissionGroupId] || [];
};
