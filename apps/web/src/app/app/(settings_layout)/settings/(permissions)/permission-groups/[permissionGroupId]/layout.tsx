import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type React from 'react';
import { prefetchPermissionGroup } from '@/api/buster_rest/permission_groups';
import { PermissionGroupIndividualLayout } from './_PermissionGroupIndividualLayout';

export default async function Layout(props: {
  children: React.ReactNode;
  params: Promise<{ permissionGroupId: string }>;
}) {
  const params = await props.params;

  const { permissionGroupId } = params;

  const { children } = props;

  const queryClient = await prefetchPermissionGroup(permissionGroupId);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PermissionGroupIndividualLayout permissionGroupId={permissionGroupId}>
        {children}
      </PermissionGroupIndividualLayout>
    </HydrationBoundary>
  );
}
