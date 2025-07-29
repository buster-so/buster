// Internal error types for access control operations

export type AccessControlErrorType =
  | 'permission_denied'
  | 'asset_not_found'
  | 'user_not_found'
  | 'invalid_email'
  | 'deprecated_asset_type'
  | 'insufficient_permissions'
  | 'database_error'
  | 'invalid_request'
  | 'organization_not_found'
  | 'team_not_found'
  | 'permission_group_not_found'
  | 'dataset_not_found'
  | 'internal_error'
  | 'cascading_permission_error'
  | 'not_implemented';

export class AccessControlError extends Error {
  constructor(
    public type: AccessControlErrorType,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AccessControlError';
  }
}

// Predefined error messages
export const accessControlErrorMessages: Record<AccessControlErrorType, string> = {
  permission_denied: 'You do not have permission to perform this action',
  asset_not_found: 'The requested asset was not found',
  user_not_found: 'The specified user was not found',
  invalid_email: 'The provided email address is invalid',
  deprecated_asset_type: 'This asset type is no longer supported',
  insufficient_permissions: 'Your permission level is insufficient for this operation',
  database_error: 'A database error occurred while processing your request',
  invalid_request: 'The request contains invalid parameters',
  organization_not_found: 'The specified organization was not found',
  team_not_found: 'The specified team was not found',
  permission_group_not_found: 'The specified permission group was not found',
  dataset_not_found: 'The specified dataset was not found',
  internal_error: 'An internal error occurred',
  cascading_permission_error: 'Error checking cascading permissions',
  not_implemented: 'This functionality is not yet implemented',
};
