import { getPermissionedDatasets } from '@buster/access-controls';
import { extractPhysicalTables, extractTablesFromYml, tablesMatch, type ParsedTable } from './sql-parser-helpers';

export interface PermissionValidationResult {
  isAuthorized: boolean;
  unauthorizedTables: string[];
  error?: string;
}

/**
 * Validates SQL query against user's permissioned datasets
 * Checks that all tables referenced in the query are accessible to the user
 */
export async function validateSqlPermissions(
  sql: string,
  userId: string
): Promise<PermissionValidationResult> {
  try {
    // Extract physical tables from SQL
    const tablesInQuery = extractPhysicalTables(sql);
    
    if (tablesInQuery.length === 0) {
      // No tables referenced (might be a function call or constant select)
      return { isAuthorized: true, unauthorizedTables: [] };
    }
    
    // Get user's permissioned datasets
    const permissionedDatasets = await getPermissionedDatasets(userId, 0, 1000);
    
    // Extract all allowed tables from datasets
    const allowedTables: ParsedTable[] = [];
    
    for (const dataset of permissionedDatasets) {
      if (dataset.ymlFile) {
        const tables = extractTablesFromYml(dataset.ymlFile);
        allowedTables.push(...tables);
      }
    }
    
    // Check each table in query against permissions
    const unauthorizedTables: string[] = [];
    
    for (const queryTable of tablesInQuery) {
      let isAuthorized = false;
      
      // Check if query table matches any allowed table
      for (const allowedTable of allowedTables) {
        if (tablesMatch(queryTable, allowedTable)) {
          isAuthorized = true;
          break;
        }
      }
      
      if (!isAuthorized) {
        unauthorizedTables.push(queryTable.fullName);
      }
    }
    
    return {
      isAuthorized: unauthorizedTables.length === 0,
      unauthorizedTables
    };
    
  } catch (error) {
    return {
      isAuthorized: false,
      unauthorizedTables: [],
      error: `Permission validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Creates a detailed error message for unauthorized table access
 */
export function createPermissionErrorMessage(unauthorizedTables: string[]): string {
  if (unauthorizedTables.length === 0) {
    return '';
  }
  
  const tableList = unauthorizedTables.join(', ');
  
  if (unauthorizedTables.length === 1) {
    return `Insufficient permissions: You do not have access to table: ${tableList}`;
  }
  
  return `Insufficient permissions: You do not have access to the following tables: ${tableList}`;
}