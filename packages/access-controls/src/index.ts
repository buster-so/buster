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

// Export utility functions
export { formatPermissionName, buildAccessQuery } from './utils';
