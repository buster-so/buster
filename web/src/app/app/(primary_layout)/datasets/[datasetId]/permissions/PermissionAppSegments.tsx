'use client';

import {
  useDatasetListDatasetGroups,
  useDatasetListPermissionGroups,
  useDatasetListPermissionUsers
} from '@/api/buster_rest';
import { AppSegmented, type SegmentedItem } from '@/components/ui/segmented';
import { Separator } from '@/components/ui/seperator';
import { useMemoizedFn, useSet } from '@/hooks';
import { BusterRoutes, createBusterRoute } from '@/routes';
import React, { useMemo, useRef } from 'react';
import { PermissionApps } from './config';

export const PermissionAppSegments: React.FC<{
  datasetId: string;
  selectedApp: PermissionApps;
}> = React.memo(({ datasetId, selectedApp }) => {
  const ref = useRef<HTMLDivElement>(null);

  useDatasetListDatasetGroups(datasetId);
  useDatasetListPermissionUsers(datasetId);
  useDatasetListPermissionGroups(datasetId);

  const options: SegmentedItem<PermissionApps>[] = useMemo(
    () =>
      [
        {
          label: 'Overview',
          value: PermissionApps.OVERVIEW,
          link: createBusterRoute({
            route: BusterRoutes.APP_DATASETS_ID_PERMISSIONS_OVERVIEW,
            datasetId
          })
        },
        {
          label: 'Permission Groups',
          value: PermissionApps.PERMISSION_GROUPS,
          link: createBusterRoute({
            route: BusterRoutes.APP_DATASETS_ID_PERMISSIONS_PERMISSION_GROUPS,
            datasetId
          })
        },
        {
          label: 'Dataset Groups',
          value: PermissionApps.DATASET_GROUPS,
          link: createBusterRoute({
            route: BusterRoutes.APP_DATASETS_ID_PERMISSIONS_DATASET_GROUPS,
            datasetId
          })
        },
        {
          label: 'Users',
          value: PermissionApps.USERS,
          link: createBusterRoute({
            route: BusterRoutes.APP_DATASETS_ID_PERMISSIONS_USERS,
            datasetId
          })
        }
      ] as SegmentedItem<PermissionApps>[],
    [datasetId]
  );

  return (
    <div ref={ref} className="border-b pb-3">
      <AppSegmented options={options} value={selectedApp} />
    </div>
  );
});

PermissionAppSegments.displayName = 'PermissionAppSegments';
