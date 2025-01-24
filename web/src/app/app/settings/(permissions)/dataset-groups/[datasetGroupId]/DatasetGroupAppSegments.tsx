'use client';

import { AppSegmented } from '@/components/segmented';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { createBusterRoute, BusterRoutes } from '@/routes/busterRoutes';
import { useDebounce } from 'ahooks';
import { Divider } from 'antd';
import React from 'react';

export enum PermissionSegmentsApps {
  USERS = 'users',
  PERMISSION_GROUPS = 'permission-groups',
  DATASETS = 'datasets'
}

const RouteToAppSegment: Record<string, PermissionSegmentsApps> = {
  [BusterRoutes.APP_SETTINGS_DATASET_GROUPS_ID_USERS]: PermissionSegmentsApps.USERS,
  [BusterRoutes.APP_SETTINGS_DATASET_GROUPS_ID_PERMISSION_GROUPS]:
    PermissionSegmentsApps.PERMISSION_GROUPS,
  [BusterRoutes.APP_SETTINGS_DATASET_GROUPS_ID_DATASETS]: PermissionSegmentsApps.DATASETS
};

export const DatasetGroupAppSegments: React.FC<{
  datasetGroupId: string;
}> = ({ datasetGroupId }) => {
  const route = useAppLayoutContextSelector((state) => state.currentRoute);
  const debouncedRoute = useDebounce(route, { wait: 10 });
  const value = RouteToAppSegment[debouncedRoute] || PermissionSegmentsApps.USERS;

  const options = React.useMemo(
    () => [
      {
        label: 'Datasets',
        value: PermissionSegmentsApps.DATASETS,
        link: createBusterRoute({
          route: BusterRoutes.APP_SETTINGS_DATASET_GROUPS_ID_DATASETS,
          datasetGroupId
        })
      },
      {
        label: 'Users',
        value: PermissionSegmentsApps.USERS,
        link: createBusterRoute({
          route: BusterRoutes.APP_SETTINGS_DATASET_GROUPS_ID_USERS,
          datasetGroupId
        })
      },
      {
        label: 'Permission groups',
        value: PermissionSegmentsApps.PERMISSION_GROUPS,
        link: createBusterRoute({
          route: BusterRoutes.APP_SETTINGS_DATASET_GROUPS_ID_PERMISSION_GROUPS,
          datasetGroupId
        })
      }
    ],
    [datasetGroupId]
  );

  return (
    <div className="flex flex-col space-y-2">
      <AppSegmented value={value} options={options} />
      <Divider />
    </div>
  );
};
