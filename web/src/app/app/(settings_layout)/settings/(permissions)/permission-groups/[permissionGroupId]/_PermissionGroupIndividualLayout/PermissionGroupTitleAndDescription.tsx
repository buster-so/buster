'use client';

import { useGetPermissionGroup, useUpdatePermissionGroup } from '@/api/buster_rest';
import { EditableTitle } from '@/components/ui/typography/EditableTitle';
import { useMemoizedFn } from '@/hooks';
import React from 'react';

export const PermissionGroupTitleAndDescription: React.FC<{
  permissionGroupId: string;
}> = React.memo(({ permissionGroupId }) => {
  const { data } = useGetPermissionGroup(permissionGroupId);
  const { mutate: updatePermissionGroup } = useUpdatePermissionGroup();

  const onChangeTitle = useMemoizedFn(async (name: string) => {
    if (!name) return;
    updatePermissionGroup([{ id: permissionGroupId, name }]);
  });

  return (
    <div className="flex flex-col space-y-0.5">
      <EditableTitle children={data?.name || ''} onChange={onChangeTitle} />
    </div>
  );
});

PermissionGroupTitleAndDescription.displayName = 'PermissionGroupTitleAndDescription';
