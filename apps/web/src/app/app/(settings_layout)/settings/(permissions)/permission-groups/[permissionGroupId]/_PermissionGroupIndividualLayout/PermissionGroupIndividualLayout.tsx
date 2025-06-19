import type React from 'react';
import { PermissionAppSegments } from './PermissionAppSegments';
import { PermissionGroupBackButton } from './PermissionBackButton';
import { PermissionGroupTitleAndDescription } from './PermissionGroupTitleAndDescription';

export const PermissionGroupIndividualLayout: React.FC<{
  children: React.ReactNode;
  permissionGroupId: string;
}> = ({ children, permissionGroupId }) => {
  return (
    <div className="flex h-full flex-col space-y-5 overflow-y-auto px-12 py-12">
      <PermissionGroupBackButton />
      <PermissionGroupTitleAndDescription permissionGroupId={permissionGroupId} />
      <PermissionAppSegments permissionGroupId={permissionGroupId} />
      {children}
    </div>
  );
};
