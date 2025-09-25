import {
  type AssetPermissionRole,
  type WorkspaceSharing,
  checkPermission,
} from '@buster/access-controls';
import { getUserOrganizationId } from '@buster/database/queries';
import type { AssetType } from '@buster/server-shared/assets';
import { HTTPException } from 'hono/http-exception';

export const checkIfAssetIsEditable = async ({
  user,
  assetId,
  assetType,
  organizationId,
  workspaceSharing,
  requiredRole = 'can_edit',
}: {
  user: {
    id: string;
  };
  assetId: string;
  assetType: AssetType;
  organizationId?: string;
  workspaceSharing: WorkspaceSharing | ((id: string) => Promise<WorkspaceSharing>);
  requiredRole?: AssetPermissionRole;
}) => {
  const workspaceSharingResult =
    typeof workspaceSharing === 'function' ? await workspaceSharing(assetId) : workspaceSharing;

  // Get user's organization ID
  const userOrgId =
    organizationId || (await getUserOrganizationId(user.id).then((res) => res?.organizationId));

  if (!userOrgId) {
    throw new HTTPException(403, { message: 'User is not associated with an organization' });
  }

  const assetPermissionResult = await checkPermission({
    userId: user.id,
    assetId,
    assetType,
    requiredRole,
    organizationId: userOrgId,
    workspaceSharing: workspaceSharingResult,
  });

  if (!assetPermissionResult.hasAccess) {
    throw new HTTPException(403, { message: 'You do not have permission to edit this asset' });
  }
};
