import type { AssetPermissionCheck } from './checks';
import { checkPermission } from './checks';

/**
 * Cached version of hasAssetPermission
 * This is a convenience wrapper that uses the caching built into checkPermission
 */
export async function hasAssetPermissionCached(params: AssetPermissionCheck): Promise<boolean> {
  const result = await checkPermission(params);
  return result.hasAccess;
}

/**
 * Export the main hasAssetPermission as the cached version
 * Since checkPermission already includes caching
 */
export { hasAssetPermissionCached as hasAssetPermission };
