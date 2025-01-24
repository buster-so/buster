'use client';

import React, { useMemo, useRef } from 'react';
import { AppSegmented } from '@/components';
import { PermissionApps } from './config';
import { useMemoizedFn, useSet } from 'ahooks';
import { SegmentedValue } from 'antd/es/segmented';
import { Divider } from 'antd';
import {
  useDatasetListDatasetGroups,
  useDatasetListPermissionGroups,
  useDatasetListPermissionUsers
} from '@/api/buster_rest';
import Link from 'next/link';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { useRouter } from 'next/navigation';

export const PermissionAppSegments: React.FC<{
  datasetId: string;
  selectedApp: PermissionApps;
}> = React.memo(({ datasetId, selectedApp }) => {
  const [prefetchedRoutes, setPrefetchedRoutes] = useSet<string>();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useDatasetListDatasetGroups(prefetchedRoutes.has(PermissionApps.DATASET_GROUPS) ? datasetId : '');
  useDatasetListPermissionUsers(prefetchedRoutes.has(PermissionApps.USERS) ? datasetId : '');
  useDatasetListPermissionGroups(
    prefetchedRoutes.has(PermissionApps.PERMISSION_GROUPS) ? datasetId : ''
  );

  const onHoverRoute = useMemoizedFn((route: string) => {
    setPrefetchedRoutes.add(route);
  });

  const options = useMemo(
    () => [
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
    ],
    [datasetId]
  );

  return (
    <div ref={ref} className="flex flex-col justify-center space-x-0 space-y-2">
      <AppSegmented options={options} value={selectedApp} />
      <Divider className="" />
    </div>
  );
});

PermissionAppSegments.displayName = 'PermissionAppSegments';
