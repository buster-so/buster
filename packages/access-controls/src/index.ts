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
} from './access-controls';

// Export utility functions
export {
  formatPermissionName,
  buildAccessQuery,
} from './utils';
