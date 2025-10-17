import {
  type AssetPermissionRole,
  checkPermission,
  type WorkspaceSharing,
} from '@buster/access-controls';
import { getUserOrganizationId } from '@buster/database/queries';
import type { AssetType } from '@buster/server-shared/assets';
import { HTTPException } from 'hono/http-exception';
import z from 'zod';

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

export const ThrowUnauthorizedErrorSchema = z.object({
  publiclyAccessible: z.boolean(),
  publicExpiryDate: z.string().optional(),
  publicPassword: z.string().optional(),
  userSuppliedPassword: z.string().optional(),
});

export type ThrowUnauthorizedErrorParams = z.infer<typeof ThrowUnauthorizedErrorSchema>;

// Decides the appropriate error to throw based on the public access settings
export function throwUnauthorizedError(params: ThrowUnauthorizedErrorParams): never {
  const { publiclyAccessible, publicExpiryDate, publicPassword, userSuppliedPassword } = params;
  if (publiclyAccessible) {
    if (publicExpiryDate) {
      try {
        if (new Date(publicExpiryDate) < new Date()) {
          throw new HTTPException(403, {
            message: 'Public access has expired',
          });
        }
      } catch {
        throw new HTTPException(403, {
          message: 'Public access expired',
        });
      }
    }
    if (publicPassword) {
      if (!userSuppliedPassword) {
        throw new HTTPException(418, {
          message: 'Password required for public access',
        });
      }
      if (userSuppliedPassword !== publicPassword) {
        throw new HTTPException(403, {
          message: 'Incorrect password for public access',
        });
      }
    }
  }
  throw new HTTPException(403, {
    message: 'You do not have permission to access this asset',
  });
}
