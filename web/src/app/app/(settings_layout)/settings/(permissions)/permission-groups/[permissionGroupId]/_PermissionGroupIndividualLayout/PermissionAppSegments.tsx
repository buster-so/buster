'use client';

import React from 'react';
import { AppSegmented } from '@/components/ui/segmented';
import { Separator } from '@/components/ui/seperator';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useDebounce } from '@/hooks';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';

export enum PermissionSegmentsApps {
  USERS = 'users',
  DATASET_GROUPS = 'dataset-groups',
  DATASETS = 'datasets'
}

const RouteToAppSegment: Record<string, PermissionSegmentsApps> = {
  [BusterRoutes.SETTINGS_PERMISSION_GROUPS_ID_USERS]: PermissionSegmentsApps.USERS,
  [BusterRoutes.SETTINGS_PERMISSION_GROUPS_ID_DATASET_GROUPS]:
    PermissionSegmentsApps.DATASET_GROUPS,
  [BusterRoutes.SETTINGS_PERMISSION_GROUPS_ID_DATASETS]: PermissionSegmentsApps.DATASETS
};

export const PermissionAppSegments: React.FC<{
  permissionGroupId: string;
}> = ({ permissionGroupId }) => {
  const route = useAppLayoutContextSelector((state) => state.currentRoute);
  const debouncedRoute = useDebounce(route, { wait: 10 });
  const value = RouteToAppSegment[debouncedRoute] || PermissionSegmentsApps.USERS;

  const options = React.useMemo(
    () => [
      {
        label: 'Users',
        value: PermissionSegmentsApps.USERS,
        link: createBusterRoute({
          route: BusterRoutes.SETTINGS_PERMISSION_GROUPS_ID_USERS,
          permissionGroupId
        })
      },
      {
        label: 'Dataset groups',
        value: PermissionSegmentsApps.DATASET_GROUPS,
        link: createBusterRoute({
          route: BusterRoutes.SETTINGS_PERMISSION_GROUPS_ID_DATASET_GROUPS,
          permissionGroupId
        })
      },
      {
        label: 'Datasets',
        value: PermissionSegmentsApps.DATASETS,
        link: createBusterRoute({
          route: BusterRoutes.SETTINGS_PERMISSION_GROUPS_ID_DATASETS,
          permissionGroupId
        })
      }
    ],
    [permissionGroupId]
  );

  return (
    <div className="flex flex-col space-y-2">
      <AppSegmented type="button" value={value} options={options} />
      <Separator />
    </div>
  );
};
