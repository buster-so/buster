// Export access control functionality
export {
  AccessControlsError,
  type Permission,
  type Role,
  type AccessControlOptions,
} from './types';

// Export access control functions
export {
  checkPermission,
  hasRole,
  validateAccess,
  getPermissionedDatasets,
  hasDatasetAccess,
  hasAllDatasetsAccess,
  type PermissionedDataset,
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
