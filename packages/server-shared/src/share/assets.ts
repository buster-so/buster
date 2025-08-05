import type { assetPermissionRoleEnum } from '@buster/database';
import { z } from 'zod';

type AssetPermissionRoleBase = (typeof assetPermissionRoleEnum.enumValues)[number];
const AssetPermissionRoleEnums: Record<AssetPermissionRoleBase, AssetPermissionRoleBase> =
  Object.freeze({
    owner: 'owner',
    viewer: 'viewer',
    full_access: 'full_access',
    can_edit: 'can_edit',
    can_filter: 'can_filter',
    can_view: 'can_view',
  });

export const AssetPermissionRoleSchema = z.enum(
  Object.values(AssetPermissionRoleEnums) as [AssetPermissionRoleBase, ...AssetPermissionRoleBase[]]
);
