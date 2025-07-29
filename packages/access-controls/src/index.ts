// Export all types
export * from './types';

// Export asset permissions (excluding cache functions to avoid conflicts)
export {
  // From permissions.ts
  hasAssetPermission,
  createPermission,
  createPermissionByEmail,
  removePermission,
  removePermissionByEmail,
  listPermissions,
  // From checks.ts
  checkPermission,
  type AssetPermissionCheck,
  type AssetPermissionResult,
  // From cascading-permissions.ts
  checkCascadingPermissions,
} from './assets';

// Export dataset permissions
export * from './datasets';

// Export user utilities
export * from './users';

// Export cache functions separately
export {
  clearAllCaches,
  invalidateUser,
  invalidateOnPermissionChange,
  getCacheStats as getAssetCacheStats,
} from './assets/cache';

// Export legacy access control functionality (for backward compatibility)
export {
  AccessControlsError,
  type Permission,
  type Role,
  type AccessControlOptions,
} from './types';

// Export legacy access control functions
export {
  checkPermission as legacyCheckPermission,
  hasRole,
  validateAccess,
  getPermissionedDatasets as legacyGetPermissionedDatasets,
  hasDatasetAccess as legacyHasDatasetAccess,
  hasAllDatasetsAccess as legacyHasAllDatasetsAccess,
  type PermissionedDataset as LegacyPermissionedDataset,
} from './access-controls';

export { canUserAccessChat } from './chats';

// Export cached version and cache management functions
export {
  canUserAccessChatCached,
  getCacheStats,
  resetCacheStats,
  clearCache,
  invalidateAccess,
  invalidateUserAccess,
  invalidateChatAccess,
} from './chats-cached';

// Export utility functions
export { formatPermissionName, buildAccessQuery } from './utils';

// Export user organization functions
export {
  checkUserInOrganization,
  getUserOrganizations,
  checkEmailDomainForOrganization,
  getOrganizationWithDefaults,
  createUserInOrganization,
  type UserOrganizationInfo,
  type OrganizationWithDefaults,
} from './user-organizations';
