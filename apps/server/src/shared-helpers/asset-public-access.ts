import {
  type AssetPermissionRole,
  type WorkspaceSharing,
  checkPermission,
} from '@buster/access-controls';
import type { AssetType } from '@buster/server-shared/assets';
import type { ShareUpdateRequest } from '@buster/server-shared/share';
import { HTTPException } from 'hono/http-exception';

// Base interface for assets with public access properties
type PublicAccessAsset = Pick<
  ShareUpdateRequest,
  'publicly_accessible' | 'public_expiry_date' | 'public_password'
>;

export const checkAssetPublicAccess = async <T extends PublicAccessAsset>({
  user,
  assetId,
  assetType,
  requiredRole = 'can_view',
  organizationId,
  workspaceSharing,
  asset,
  password,
}: {
  user: {
    id: string;
  };
  assetId: string;
  assetType: AssetType;
  requiredRole?: AssetPermissionRole;
  organizationId: string;
  workspaceSharing: WorkspaceSharing;
  password: string | undefined;
  asset: T;
}): Promise<T> => {
  const assetPermissionResult = await checkPermission({
    userId: user.id,
    assetId,
    assetType,
    requiredRole,
    organizationId,
    workspaceSharing,
  });

  if (!assetPermissionResult.hasAccess) {
    const now = new Date();
    if (asset.publicly_accessible) {
      if (asset.public_expiry_date && new Date(asset.public_expiry_date) < now) {
        throw new HTTPException(403, { message: 'Public access to this report has expired' });
      }
      if (asset.public_password && !password) {
        throw new HTTPException(418, { message: 'Password required for public access' });
      }
      if (asset.public_password && asset.public_password !== password) {
        throw new HTTPException(403, { message: 'Password required for public access' });
      }
    }
    throw new HTTPException(403, { message: 'You do not have permission to view this report' });
  }

  return asset;
};

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
  organizationId: string;
  workspaceSharing: WorkspaceSharing;
  requiredRole?: AssetPermissionRole | AssetPermissionRole[];
}) => {
  const assetPermissionResult = await checkPermission({
    userId: user.id,
    assetId,
    assetType,
    requiredRole,
    organizationId,
    workspaceSharing,
  });

  if (!assetPermissionResult.hasAccess) {
    throw new HTTPException(403, { message: 'You do not have permission to edit this asset' });
  }
};
