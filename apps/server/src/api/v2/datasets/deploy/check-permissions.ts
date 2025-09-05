/**
 * Check if user has permission to deploy datasets
 * Pure function that validates user permissions
 */
export function canUserDeployDatasets(organizationRole: string): boolean {
  return organizationRole === 'workspace_admin' || organizationRole === 'data_admin';
}

/**
 * Get permission error message
 */
export function getPermissionError(): string {
  return 'Insufficient permissions. Must be workspace_admin or data_admin to deploy datasets.';
}
