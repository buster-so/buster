'use client';

import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { BusterRoutes } from '@/routes';
import { PermissionApps } from './config';
import { PermissionAppSegments } from './PermissionAppSegments';

const routeToApp: Record<string, PermissionApps> = {
  [BusterRoutes.APP_DATASETS_ID_PERMISSIONS_OVERVIEW]: PermissionApps.OVERVIEW,
  [BusterRoutes.APP_DATASETS_ID_PERMISSIONS_PERMISSION_GROUPS]: PermissionApps.PERMISSION_GROUPS,
  [BusterRoutes.APP_DATASETS_ID_PERMISSIONS_DATASET_GROUPS]: PermissionApps.DATASET_GROUPS,
  [BusterRoutes.APP_DATASETS_ID_PERMISSIONS_USERS]: PermissionApps.USERS
};

export const PermissionsAppContainer: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { datasetId } = useParams();
  const currentRoute = useAppLayoutContextSelector((x) => x.currentRoute);
  const [selectedApp, setSelectedApp] = useState<PermissionApps>(PermissionApps.OVERVIEW);

  useEffect(() => {
    setSelectedApp(routeToApp[currentRoute] || PermissionApps.OVERVIEW);
  }, [currentRoute]);

  return (
    <>
      <PermissionAppSegments selectedApp={selectedApp} datasetId={datasetId as string} />

      {children}
    </>
  );
};

PermissionsAppContainer.displayName = 'PermissionsAppContainer';
