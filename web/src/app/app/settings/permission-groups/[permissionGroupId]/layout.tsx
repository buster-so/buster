import React from 'react';
import { PermissionGroupTitleAndDescription } from './PermissionGroupTitleAndDescription';
import { prefetchPermissionGroup } from '@/api/buster_rest';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { UsersBackButton } from './PermissionBackButton';
import { PermissionAppSegments } from './PermissionAppSegments';

export default async function Layout({
  children,
  params: { permissionGroupId }
}: {
  children: React.ReactNode;
  params: { permissionGroupId: string };
}) {
  const queryClient = await prefetchPermissionGroup(permissionGroupId);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex h-full flex-col space-y-5 overflow-y-auto px-12 py-12">
        <UsersBackButton />
        <PermissionGroupTitleAndDescription permissionGroupId={permissionGroupId} />
        <PermissionAppSegments permissionGroupId={permissionGroupId} />
        {children}
      </div>
    </HydrationBoundary>
  );
}
