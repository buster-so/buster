// Export all types

// Export legacy access control functions
export {
  checkPermission as legacyCheckPermission,
  getPermissionedDatasets as legacyGetPermissionedDatasets,
  hasAllDatasetsAccess as legacyHasAllDatasetsAccess,
  hasDatasetAccess as legacyHasDatasetAccess,
  hasRole,
  type PermissionedDataset as LegacyPermissionedDataset,
  validateAccess,
} from './access-controls';

// Export asset permissions (excluding cache functions to avoid conflicts)
export {
  type AssetPermissionCheck,
  type AssetPermissionResult,
  // From cascading-permissions.ts
  checkCascadingPermissions,
  checkDashboardChatAccess,
  checkDashboardCollectionAccess,
  checkMetricChatAccess,
  checkMetricCollectionAccess,
  checkMetricDashboardAccess,
  checkMetricReportAccess,
  // From checks.ts
  checkPermission,
  computeEffectivePermission,
  createPermission,
  createPermissionByEmail,
  // From permissions.ts
  hasAssetPermission,
  listPermissions,
  removePermission,
  removePermissionByEmail,
} from './assets';
// Export cache functions separately
export {
  clearAllCaches,
  getCacheStats as getAssetCacheStats,
  invalidateOnPermissionChange,
  invalidateUser,
} from './assets/cache';
export { canUserAccessChat } from './chats';
// Export cached version and cache management functions
export {
  canUserAccessChatCached,
  clearCache,
  getCacheStats,
  invalidateAccess,
  invalidateChatAccess,
  invalidateUserAccess,
  resetCacheStats,
} from './chats-cached';
// Export dataset permissions
export * from './datasets';
// Export SQL permissions
export * from './sql-permissions';
export * from './types';
// Export legacy access control functionality (for backward compatibility)
export {
  type AccessControlOptions,
  AccessControlsError,
  type Permission,
  type Role,
} from './types';
// Export user organization functions
export {
  checkEmailDomainForOrganization,
  checkUserInOrganization,
  createUserInOrganization,
  getOrganizationWithDefaults,
  getUserOrganizations,
  type OrganizationWithDefaults,
  type UserOrganizationInfo,
} from './user-organizations';
// Export user utilities
export * from './users';
// Export utility functions
export { buildAccessQuery, formatPermissionName } from './utils';
