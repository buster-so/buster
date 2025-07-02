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
  userId: string,
  dataSourceSyntax?: string
): Promise<PermissionValidationResult> {
  try {
    console.info('[validateSqlPermissions] Starting validation for userId:', userId);
    console.info('[validateSqlPermissions] SQL query:', sql);
    console.info('[validateSqlPermissions] Data source syntax:', dataSourceSyntax);
    
    // Extract physical tables from SQL
    const tablesInQuery = extractPhysicalTables(sql, dataSourceSyntax);
    console.info('[validateSqlPermissions] Tables extracted from SQL:', JSON.stringify(tablesInQuery, null, 2));
    
    if (tablesInQuery.length === 0) {
      // No tables referenced (might be a function call or constant select)
      console.info('[validateSqlPermissions] No tables found in query, allowing access');
      return { isAuthorized: true, unauthorizedTables: [] };
    }
    
    // Get user's permissioned datasets
    const permissionedDatasets = await getPermissionedDatasets(userId, 0, 1000);
    console.info('[validateSqlPermissions] Found', permissionedDatasets.length, 'permissioned datasets for user');
    
    // Extract all allowed tables from datasets
    const allowedTables: ParsedTable[] = [];
    
    for (const dataset of permissionedDatasets) {
      if (dataset.ymlFile) {
        const tables = extractTablesFromYml(dataset.ymlFile);
        console.info('[validateSqlPermissions] Extracted', tables.length, 'tables from dataset:', dataset.name || 'unnamed');
        console.info('[validateSqlPermissions] Tables from YML:', JSON.stringify(tables, null, 2));
        allowedTables.push(...tables);
      }
    }
    
    console.info('[validateSqlPermissions] Total allowed tables:', allowedTables.length);
    console.info('[validateSqlPermissions] All allowed tables:', JSON.stringify(allowedTables, null, 2));
    
    // Check each table in query against permissions
    const unauthorizedTables: string[] = [];
    
    for (const queryTable of tablesInQuery) {
      let isAuthorized = false;
      
      // Check if query table matches any allowed table
      for (const allowedTable of allowedTables) {
        const matches = tablesMatch(queryTable, allowedTable);
        if (matches) {
          console.info('[validateSqlPermissions] Table match found:', 
            `Query: ${JSON.stringify(queryTable)} matches Allowed: ${JSON.stringify(allowedTable)}`);
          isAuthorized = true;
          break;
        }
      }
      
      if (!isAuthorized) {
        console.error('[validateSqlPermissions] Unauthorized table access:', queryTable.fullName);
        unauthorizedTables.push(queryTable.fullName);
      }
    }
    
    const result = {
      isAuthorized: unauthorizedTables.length === 0,
      unauthorizedTables
    };
    
    console.info('[validateSqlPermissions] Final result:', JSON.stringify(result, null, 2));
    return result;
    
  } catch (error) {
    console.error('[validateSqlPermissions] Error during validation:', error);
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