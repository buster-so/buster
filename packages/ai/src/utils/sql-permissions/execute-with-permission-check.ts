import { createPermissionErrorMessage, validateSqlPermissions } from './permission-validator';

export interface ExecuteWithPermissionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Wraps SQL execution with permission validation
 * Ensures user has access to all tables referenced in the query
 */
export async function executeWithPermissionCheck<T>(
  sql: string,
  userId: string,
  executeFn: () => Promise<T>,
  dataSourceSyntax?: string
): Promise<ExecuteWithPermissionResult<T>> {
  if (!userId) {
    return {
      success: false,
      error: 'User authentication required for SQL execution',
    };
  }

  // Validate permissions
  const permissionResult = await validateSqlPermissions(sql, userId, dataSourceSyntax);

  if (!permissionResult.isAuthorized) {
    return {
      success: false,
      error: createPermissionErrorMessage(
        permissionResult.unauthorizedTables,
        permissionResult.unauthorizedColumns
      ),
    };
  }

  // Execute if authorized
  try {
    const result = await executeFn();
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'SQL execution failed',
    };
  }
}
