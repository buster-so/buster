import { validateSqlPermissions, createPermissionErrorMessage } from './permission-validator';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import type { AnalystRuntimeContext } from '../../workflows/analyst-workflow';

export interface ExecuteWithPermissionResult<T = any> {
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
  runtimeContext: RuntimeContext<AnalystRuntimeContext>,
  executeFn: () => Promise<T>
): Promise<ExecuteWithPermissionResult<T>> {
  const userId = runtimeContext.get('userId');
  
  if (!userId) {
    return {
      success: false,
      error: 'User authentication required for SQL execution'
    };
  }
  
  // Validate permissions
  const permissionResult = await validateSqlPermissions(sql, userId);
  
  if (!permissionResult.isAuthorized) {
    return {
      success: false,
      error: createPermissionErrorMessage(permissionResult.unauthorizedTables)
    };
  }
  
  // Execute if authorized
  try {
    const result = await executeFn();
    return {
      success: true,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'SQL execution failed'
    };
  }
}