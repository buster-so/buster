import pkg from 'node-sql-parser';
const { Parser } = pkg;
import type { BaseFrom, ColumnRefItem, Join, Select } from 'node-sql-parser';
import * as yaml from 'yaml';
// Import checkQueryIsReadOnly from data-source package
export { checkQueryIsReadOnly } from '@buster/data-source';
export type { QueryTypeCheckResult } from '@buster/data-source';

export interface ParsedTable {
  database?: string;
  schema?: string;
  table: string;
  fullName: string;
  alias?: string;
}

export interface ParsedDataset {
  database?: string;
  schema?: string;
  table: string;
  fullName: string;
  allowedColumns: Set<string>; // lowercase column names from dimensions and measures
}

// Type for statements that may have UNION (_next property)
interface StatementWithNext extends Record<string, unknown> {
  _next?: StatementWithNext;
  type?: string;
}

export interface WildcardValidationResult {
  isValid: boolean;
  error?: string;
  blockedTables?: string[];
}

// Map data source syntax to node-sql-parser dialect
const DIALECT_MAPPING: Record<string, string> = {
  // Direct mappings
  mysql: 'mysql',
  postgresql: 'postgresql',
  sqlite: 'sqlite',
  mariadb: 'mariadb',
  bigquery: 'bigquery',
  snowflake: 'snowflake',
  redshift: 'postgresql', // Redshift uses PostgreSQL dialect
  transactsql: 'transactsql',
  flinksql: 'flinksql',
  hive: 'hive',

  // Alternative names
  postgres: 'postgresql',
  mssql: 'transactsql',
  sqlserver: 'transactsql',
  athena: 'postgresql', // Athena uses Presto/PostgreSQL syntax
  db2: 'db2',
  noql: 'mysql', // Default fallback for NoQL
};

function getParserDialect(dataSourceSyntax?: string): string {
  if (!dataSourceSyntax) {
    return 'postgresql';
  }

  const dialect = DIALECT_MAPPING[dataSourceSyntax.toLowerCase()];
  if (!dialect) {
    return 'postgresql';
  }

  return dialect;
}

/**
 * Extracts physical tables from SQL query, excluding CTEs
 * Returns database.schema.table references with proper qualification
 */
export function extractPhysicalTables(sql: string, dataSourceSyntax?: string): ParsedTable[] {
  const dialect = getParserDialect(dataSourceSyntax);
  const parser = new Parser();

  try {
    // Parse SQL into AST with the appropriate dialect
    const ast = parser.astify(sql, { database: dialect });

    // Get all table references from parser with the appropriate dialect
    const allTables = parser.tableList(sql, { database: dialect });

    // Extract CTE names to exclude them
    const cteNames = new Set<string>();

    // Handle single statement or array of statements
    const statements = Array.isArray(ast) ? ast : [ast];

    for (const statement of statements) {
      // Type guard to check if statement has 'with' property
      if ('with' in statement && statement.with && Array.isArray(statement.with)) {
        for (const cte of statement.with) {
          if (cte.name?.value) {
            cteNames.add(cte.name.value.toLowerCase());
          }
        }
      }
    }

    // Parse table references and filter out CTEs
    const physicalTables: ParsedTable[] = [];
    const processedTables = new Set<string>();

    for (const tableRef of allTables) {
      const parsed = parseTableReference(tableRef);

      // Skip if it's a CTE
      if (cteNames.has(parsed.table.toLowerCase())) {
        continue;
      }

      // Skip duplicates
      const tableKey = `${parsed.database || ''}.${parsed.schema || ''}.${parsed.table}`;
      if (processedTables.has(tableKey)) {
        continue;
      }

      processedTables.add(tableKey);
      physicalTables.push(parsed);
    }

    return physicalTables;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Provide more specific guidance based on common parsing errors
    if (errorMessage.includes('Expected')) {
      throw new Error(
        `SQL syntax error: ${errorMessage}. Please check your SQL syntax and ensure it's valid for the ${dialect} dialect.`
      );
    }
    if (errorMessage.includes('Unexpected token')) {
      throw new Error(
        `SQL parsing error: ${errorMessage}. This may be due to unsupported SQL features or incorrect syntax.`
      );
    }
    throw new Error(
      `Failed to parse SQL query: ${errorMessage}. Please ensure your SQL is valid and uses standard ${dialect} syntax.`
    );
  }
}

/**
 * Parses a table reference string into its components
 * Handles formats like:
 * - table
 * - schema.table
 * - database.schema.table
 * - type::database::table (node-sql-parser format)
 * - type::schema.table (node-sql-parser format)
 */
export function parseTableReference(tableRef: string): ParsedTable {
  // Remove any quotes and trim
  let cleanRef = tableRef.replace(/["'`\[\]]/g, '').trim();

  // Handle node-sql-parser format: "type::database::table" or "type::table"
  if (cleanRef.includes('::')) {
    const parts = cleanRef.split('::');
    // Remove the type prefix (select, insert, update, etc.)
    const firstPart = parts[0];
    if (
      parts.length >= 2 &&
      firstPart &&
      ['select', 'insert', 'update', 'delete', 'create', 'drop', 'alter'].includes(firstPart)
    ) {
      parts.shift(); // Remove type
    }
    cleanRef = parts.join('.');
  }

  // Split by . for schema/table
  const parts = cleanRef.split('.').filter((p) => p && p !== 'null');

  if (parts.length === 3) {
    const [database, schema, table] = parts;
    if (!database || !schema || !table) {
      return {
        table: cleanRef,
        fullName: cleanRef,
      };
    }
    return {
      database,
      schema,
      table,
      fullName: `${database}.${schema}.${table}`,
    };
  }

  if (parts.length === 2) {
    const [schema, table] = parts;
    if (!schema || !table) {
      return {
        table: cleanRef,
        fullName: cleanRef,
      };
    }
    return {
      schema,
      table,
      fullName: `${schema}.${table}`,
    };
  }

  if (parts.length === 1) {
    const [table] = parts;
    if (!table) {
      return {
        table: cleanRef,
        fullName: cleanRef,
      };
    }
    return {
      table,
      fullName: table,
    };
  }

  return {
    table: cleanRef,
    fullName: cleanRef,
  };
}

/**
 * Normalizes a table identifier for comparison
 * Converts to lowercase and handles different qualification levels
 */
export function normalizeTableIdentifier(identifier: ParsedTable): string {
  const parts = [];

  if (identifier.database) {
    parts.push(identifier.database.toLowerCase());
  }
  if (identifier.schema) {
    parts.push(identifier.schema.toLowerCase());
  }
  parts.push(identifier.table.toLowerCase());

  return parts.join('.');
}

/**
 * Checks if two table identifiers match, considering different qualification levels
 * For example, "schema.table" matches "database.schema.table" if schema and table match
 */
export function tablesMatch(queryTable: ParsedTable, permissionTable: ParsedTable): boolean {
  // Exact table name must match
  if (queryTable.table.toLowerCase() !== permissionTable.table.toLowerCase()) {
    return false;
  }

  // If permission specifies schema, query must match
  if (permissionTable.schema && queryTable.schema) {
    if (permissionTable.schema.toLowerCase() !== queryTable.schema.toLowerCase()) {
      return false;
    }
  }

  // If permission specifies database, query must match
  if (permissionTable.database && queryTable.database) {
    if (permissionTable.database.toLowerCase() !== queryTable.database.toLowerCase()) {
      return false;
    }
  }

  // If permission has schema but query doesn't, it's not a match
  // (we require explicit schema matching for security)
  if (permissionTable.schema && !queryTable.schema) {
    return false;
  }

  return true;
}

/**
 * Extracts table references from dataset YML content
 * Handles multiple formats:
 * 1. Flat format (top-level fields):
 *    name: table_name
 *    schema: schema_name
 *    database: database_name
 * 2. Models array with separate fields:
 *    models:
 *      - name: table_name
 *        schema: schema_name
 *        database: database_name
 */
export function extractTablesFromYml(ymlContent: string): ParsedTable[] {
  const tables: ParsedTable[] = [];
  const processedTables = new Set<string>();

  try {
    // Parse YML content
    const parsed = yaml.parse(ymlContent);

    // Check for flat format (top-level name, schema, database)
    if (parsed?.name && !parsed?.models && (parsed?.schema || parsed?.database)) {
      const parsedTable: ParsedTable = {
        table: parsed.name,
        fullName: parsed.name,
      };

      // Add schema if present
      if (parsed.schema) {
        parsedTable.schema = parsed.schema;
        parsedTable.fullName = `${parsed.schema}.${parsed.name}`;
      }

      // Add database if present
      if (parsed.database) {
        parsedTable.database = parsed.database;
        if (parsed.schema) {
          parsedTable.fullName = `${parsed.database}.${parsed.schema}.${parsed.name}`;
        } else {
          parsedTable.fullName = `${parsed.database}.${parsed.name}`;
        }
      }

      const key = normalizeTableIdentifier(parsedTable);
      if (!processedTables.has(key)) {
        processedTables.add(key);
        tables.push(parsedTable);
      }
    }

    // Look for models array
    if (parsed?.models && Array.isArray(parsed.models)) {
      for (const model of parsed.models) {
        // Process models that have name and at least schema or database
        if (model.name && (model.schema || model.database)) {
          const parsedTable: ParsedTable = {
            table: model.name,
            fullName: model.name,
          };

          // Add schema if present
          if (model.schema) {
            parsedTable.schema = model.schema;
            parsedTable.fullName = `${model.schema}.${model.name}`;
          }

          // Add database if present
          if (model.database) {
            parsedTable.database = model.database;
            if (model.schema) {
              parsedTable.fullName = `${model.database}.${model.schema}.${model.name}`;
            } else {
              parsedTable.fullName = `${model.database}.${model.name}`;
            }
          }

          const key = normalizeTableIdentifier(parsedTable);
          if (!processedTables.has(key)) {
            processedTables.add(key);
            tables.push(parsedTable);
          }
        }
      }
    }
  } catch (error) {
    // Log the error for debugging but don't throw - return empty array
    // This is expected behavior when YML content is invalid or not a dataset
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`Failed to parse YML content for table extraction: ${errorMessage}`);
  }

  return tables;
}

/**
 * Extracts datasets with allowed columns from YML content
 * Handles dataset format with dimensions and measures
 */
export function extractDatasetsFromYml(ymlContent: string): ParsedDataset[] {
  const datasets: ParsedDataset[] = [];
  const processedDatasets = new Set<string>();

  try {
    // Parse YML content
    const parsed = yaml.parse(ymlContent);

    // Check for dataset format with dimensions and measures
    if (parsed?.name) {
      const parsedDataset: ParsedDataset = {
        table: parsed.name,
        fullName: parsed.name,
        allowedColumns: new Set<string>(),
      };

      // Add schema if present
      if (parsed.schema) {
        parsedDataset.schema = parsed.schema;
        parsedDataset.fullName = `${parsed.schema}.${parsed.name}`;
      }

      // Add database if present
      if (parsed.database) {
        parsedDataset.database = parsed.database;
        if (parsed.schema) {
          parsedDataset.fullName = `${parsed.database}.${parsed.schema}.${parsed.name}`;
        } else {
          parsedDataset.fullName = `${parsed.database}.${parsed.name}`;
        }
      }

      // Extract columns from dimensions
      if (parsed.dimensions && Array.isArray(parsed.dimensions)) {
        for (const dimension of parsed.dimensions) {
          if (dimension.name && typeof dimension.name === 'string') {
            parsedDataset.allowedColumns.add(dimension.name.toLowerCase());
          }
        }
      }

      // Extract columns from measures
      if (parsed.measures && Array.isArray(parsed.measures)) {
        for (const measure of parsed.measures) {
          if (measure.name && typeof measure.name === 'string') {
            parsedDataset.allowedColumns.add(measure.name.toLowerCase());
          }
        }
      }

      const key = normalizeTableIdentifier(parsedDataset);
      if (!processedDatasets.has(key)) {
        processedDatasets.add(key);
        datasets.push(parsedDataset);
      }
    }

    // Also check for models array format with dimensions/measures
    if (parsed?.models && Array.isArray(parsed.models)) {
      for (const model of parsed.models) {
        if (model.name) {
          const parsedDataset: ParsedDataset = {
            table: model.name,
            fullName: model.name,
            allowedColumns: new Set<string>(),
          };

          // Add schema if present
          if (model.schema) {
            parsedDataset.schema = model.schema;
            parsedDataset.fullName = `${model.schema}.${model.name}`;
          }

          // Add database if present
          if (model.database) {
            parsedDataset.database = model.database;
            if (model.schema) {
              parsedDataset.fullName = `${model.database}.${model.schema}.${model.name}`;
            } else {
              parsedDataset.fullName = `${model.database}.${model.name}`;
            }
          }

          // Extract columns from dimensions
          if (model.dimensions && Array.isArray(model.dimensions)) {
            for (const dimension of model.dimensions) {
              if (dimension.name && typeof dimension.name === 'string') {
                parsedDataset.allowedColumns.add(dimension.name.toLowerCase());
              }
            }
          }

          // Extract columns from measures
          if (model.measures && Array.isArray(model.measures)) {
            for (const measure of model.measures) {
              if (measure.name && typeof measure.name === 'string') {
                parsedDataset.allowedColumns.add(measure.name.toLowerCase());
              }
            }
          }

          const key = normalizeTableIdentifier(parsedDataset);
          if (!processedDatasets.has(key)) {
            processedDatasets.add(key);
            datasets.push(parsedDataset);
          }
        }
      }
    }
  } catch (error) {
    // Log the error for debugging but don't throw - return empty array
    // This is expected behavior when YML content is invalid or not a dataset
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`Failed to parse YML content for dataset extraction: ${errorMessage}`);
  }

  return datasets;
}

/**
 * Validates that wildcards (SELECT *) are not used on physical tables
 * Allows wildcards on CTEs but blocks them on physical database tables
 */
export function validateWildcardUsage(
  sql: string,
  dataSourceSyntax?: string
): WildcardValidationResult {
  const dialect = getParserDialect(dataSourceSyntax);
  const parser = new Parser();

  try {
    // Parse SQL into AST with the appropriate dialect
    const ast = parser.astify(sql, { database: dialect });

    // Handle single statement or array of statements
    const statements = Array.isArray(ast) ? ast : [ast];

    // Extract CTE names to allow wildcards on them
    const cteNames = new Set<string>();
    for (const statement of statements) {
      if ('with' in statement && statement.with && Array.isArray(statement.with)) {
        for (const cte of statement.with) {
          if (cte.name?.value) {
            cteNames.add(cte.name.value.toLowerCase());
          }
        }
      }
    }

    const tableList = parser.tableList(sql, { database: dialect });
    const tableAliasMap = new Map<string, string>(); // alias -> table name

    if (Array.isArray(tableList)) {
      for (const tableRef of tableList) {
        if (typeof tableRef === 'string') {
          // Simple table name
          tableAliasMap.set(tableRef.toLowerCase(), tableRef);
        } else if (tableRef && typeof tableRef === 'object') {
          const tableRefObj = tableRef as Record<string, unknown>;
          const tableName = tableRefObj.table || tableRefObj.name;
          const alias = tableRefObj.as || tableRefObj.alias;
          if (tableName && typeof tableName === 'string') {
            if (alias && typeof alias === 'string') {
              tableAliasMap.set(alias.toLowerCase(), tableName);
            }
            tableAliasMap.set(tableName.toLowerCase(), tableName);
          }
        }
      }
    }

    // Check each statement for wildcard usage
    const blockedTables: string[] = [];

    for (const statement of statements) {
      if ('type' in statement && statement.type === 'select') {
        const wildcardTables = findWildcardUsageOnPhysicalTables(
          statement as unknown as Record<string, unknown>,
          cteNames
        );
        blockedTables.push(...wildcardTables);
      }
    }

    if (blockedTables.length > 0) {
      // Create a more helpful error message with specific tables and guidance
      const tableList =
        blockedTables.length > 1
          ? `tables: ${blockedTables.join(', ')}`
          : `table: ${blockedTables[0]}`;

      return {
        isValid: false,
        error: `SELECT * is not allowed on physical ${tableList}. Please explicitly specify the column names you need instead of using wildcards. For example, use 'SELECT column1, column2 FROM table' instead of 'SELECT * FROM table'. This restriction helps ensure data security and prevents unintended data exposure.`,
        blockedTables,
      };
    }

    return { isValid: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      isValid: false,
      error: `Failed to validate wildcard usage in SQL query: ${errorMessage}. Please ensure your SQL syntax is correct and try specifying explicit column names instead of using SELECT *.`,
    };
  }
}

/**
 * Recursively finds wildcard usage on physical tables in a SELECT statement
 */
function findWildcardUsageOnPhysicalTables(
  selectStatement: Record<string, unknown>,
  cteNames: Set<string>
): string[] {
  const blockedTables: string[] = [];

  // Build alias mapping for this statement
  const aliasToTableMap = new Map<string, string>();
  if (selectStatement.from && Array.isArray(selectStatement.from)) {
    for (const fromItem of selectStatement.from) {
      const fromItemAny = fromItem as unknown as Record<string, unknown>;
      if (fromItemAny.table && fromItemAny.as) {
        let tableName: string;
        if (typeof fromItemAny.table === 'string') {
          tableName = fromItemAny.table;
        } else if (fromItemAny.table && typeof fromItemAny.table === 'object') {
          const tableObj = fromItemAny.table as Record<string, unknown>;
          tableName = String(
            tableObj.table || tableObj.name || tableObj.value || fromItemAny.table
          );
        } else {
          continue;
        }
        aliasToTableMap.set(String(fromItemAny.as).toLowerCase(), tableName.toLowerCase());
      }

      // Handle JOINs
      if (fromItemAny.join && Array.isArray(fromItemAny.join)) {
        for (const joinItem of fromItemAny.join) {
          if (joinItem.table && joinItem.as) {
            let tableName: string;
            if (typeof joinItem.table === 'string') {
              tableName = joinItem.table;
            } else if (joinItem.table && typeof joinItem.table === 'object') {
              const tableObj = joinItem.table as Record<string, unknown>;
              tableName = String(
                tableObj.table || tableObj.name || tableObj.value || joinItem.table
              );
            } else {
              continue;
            }
            aliasToTableMap.set(String(joinItem.as).toLowerCase(), tableName.toLowerCase());
          }
        }
      }
    }
  }

  if (selectStatement.columns && Array.isArray(selectStatement.columns)) {
    for (const column of selectStatement.columns) {
      if (column.expr && column.expr.type === 'column_ref') {
        // Check for unqualified wildcard (SELECT *)
        if (column.expr.column === '*' && !column.expr.table) {
          // Get all tables in FROM clause that are not CTEs
          const physicalTables = getPhysicalTablesFromFrom(
            selectStatement.from as unknown as Record<string, unknown>[],
            cteNames
          );
          blockedTables.push(...physicalTables);
        }
        // Check for qualified wildcard (SELECT table.*)
        else if (column.expr.column === '*' && column.expr.table) {
          // Handle table reference - could be string or object
          let tableName: string;
          if (typeof column.expr.table === 'string') {
            tableName = column.expr.table;
          } else if (column.expr.table && typeof column.expr.table === 'object') {
            // Handle object format - could have table property or be the table name itself
            const tableRefObj = column.expr.table as Record<string, unknown>;
            tableName = String(
              tableRefObj.table || tableRefObj.name || tableRefObj.value || column.expr.table
            );
          } else {
            continue; // Skip if we can't determine table name
          }

          // Check if this is an alias that maps to a CTE
          const actualTableName = aliasToTableMap.get(tableName.toLowerCase());
          const isAliasToCte = actualTableName && cteNames.has(actualTableName);
          const isDirectCte = cteNames.has(tableName.toLowerCase());

          if (!isAliasToCte && !isDirectCte) {
            // Push the actual table name if it's an alias, otherwise push the table name itself
            blockedTables.push(actualTableName || tableName);
          }
        }
      }
    }
  }

  // Check CTEs for nested wildcard usage
  if (selectStatement.with && Array.isArray(selectStatement.with)) {
    for (const cte of selectStatement.with) {
      const cteAny = cte as unknown as Record<string, unknown>;
      if (cteAny.stmt && typeof cteAny.stmt === 'object' && cteAny.stmt !== null) {
        const stmt = cteAny.stmt as Record<string, unknown>;
        if (stmt.type === 'select') {
          const subBlocked = findWildcardUsageOnPhysicalTables(stmt, cteNames);
          blockedTables.push(...subBlocked);
        }
      }
    }
  }

  if (selectStatement.from && Array.isArray(selectStatement.from)) {
    for (const fromItem of selectStatement.from) {
      const fromItemAny = fromItem as unknown as Record<string, unknown>;
      if (fromItemAny.expr && typeof fromItemAny.expr === 'object' && fromItemAny.expr !== null) {
        const expr = fromItemAny.expr as Record<string, unknown>;
        if (expr.type === 'select') {
          const subBlocked = findWildcardUsageOnPhysicalTables(expr, cteNames);
          blockedTables.push(...subBlocked);
        }
      }
    }
  }

  return blockedTables;
}

/**
 * Extracts physical table names from FROM clause, excluding CTEs
 */
function getPhysicalTablesFromFrom(
  fromClause: Record<string, unknown>[],
  cteNames: Set<string>
): string[] {
  const tables: string[] = [];

  if (!fromClause || !Array.isArray(fromClause)) {
    return tables;
  }

  for (const fromItem of fromClause) {
    // Extract table name from fromItem
    if (fromItem.table) {
      let tableName: string;
      if (typeof fromItem.table === 'string') {
        tableName = fromItem.table;
      } else if (fromItem.table && typeof fromItem.table === 'object') {
        const tableObj = fromItem.table as Record<string, unknown>;
        tableName = String(tableObj.table || tableObj.name || tableObj.value || fromItem.table);
      } else {
        continue;
      }

      if (tableName && !cteNames.has(tableName.toLowerCase())) {
        const aliasName = fromItem.as || tableName;
        tables.push(String(aliasName));
      }
    }

    // Handle JOINs
    if (fromItem.join && Array.isArray(fromItem.join)) {
      for (const joinItem of fromItem.join) {
        if (joinItem.table) {
          let tableName: string;
          if (typeof joinItem.table === 'string') {
            tableName = joinItem.table;
          } else if (joinItem.table && typeof joinItem.table === 'object') {
            const tableObj = joinItem.table as Record<string, unknown>;
            tableName = String(tableObj.table || tableObj.name || tableObj.value || joinItem.table);
          } else {
            continue;
          }

          if (tableName && !cteNames.has(tableName.toLowerCase())) {
            const aliasName = joinItem.as || tableName;
            tables.push(String(aliasName));
          }
        }
      }
    }
  }

  return tables;
}

/**
 * Extracts column references from SQL query grouped by table
 * Returns a map of table -> set of column names referenced
 * Excludes CTE internal columns
 */
export function extractColumnReferences(
  sql: string,
  dataSourceSyntax?: string
): Map<string, Set<string>> {
  const dialect = getParserDialect(dataSourceSyntax);
  const parser = new Parser();
  const tableColumnMap = new Map<string, Set<string>>();

  try {
    // Parse SQL into AST
    const ast = parser.astify(sql, { database: dialect });
    const statements = Array.isArray(ast) ? ast : [ast];

    // Get CTEs to exclude from column validation
    const cteNames = new Set<string>();
    for (const statement of statements) {
      if ('with' in statement && statement.with && Array.isArray(statement.with)) {
        for (const cte of statement.with) {
          if (cte.name?.value) {
            cteNames.add(cte.name.value.toLowerCase());
          }
        }
      }
    }

    // Process each statement
    for (const statement of statements) {
      // First process CTEs in the main statement
      if ('with' in statement && statement.with && Array.isArray(statement.with)) {
        for (const cte of statement.with) {
          if (cte.stmt && typeof cte.stmt === 'object') {
            const cteStmt = cte.stmt as Record<string, unknown>;
            // Handle CTEs with UNION/UNION ALL - they have an ast property
            // Check for ast first since UNION CTEs don't have a direct type property
            if (!cteStmt.type && cteStmt.ast && typeof cteStmt.ast === 'object') {
              const ast = cteStmt.ast as Record<string, unknown>;
              if (ast.type === 'select') {
                // Process the first SELECT
                extractColumnsFromStatement(ast, tableColumnMap, cteNames);

                // Process UNION parts (_next chain)
                let nextStmt = ast._next as Record<string, unknown> | undefined;
                while (nextStmt) {
                  if (nextStmt.type === 'select') {
                    extractColumnsFromStatement(nextStmt, tableColumnMap, cteNames);
                  }
                  nextStmt = nextStmt._next as Record<string, unknown> | undefined;
                }
              }
            } else if (cteStmt.type === 'select') {
              // CTE with type 'select' - may have UNION via _next
              extractColumnsFromStatement(cteStmt, tableColumnMap, cteNames);

              // Handle UNION parts (_next chain) for CTEs
              const cteWithNext = cteStmt as StatementWithNext;
              let nextStmt = cteWithNext._next;
              while (nextStmt) {
                if (nextStmt.type === 'select') {
                  extractColumnsFromStatement(nextStmt, tableColumnMap, cteNames);
                }
                nextStmt = nextStmt._next;
              }
            }
          }
        }
      }

      if ('type' in statement && statement.type === 'select') {
        // Process the main SELECT statement
        extractColumnsFromStatement(
          statement as unknown as Record<string, unknown>,
          tableColumnMap,
          cteNames
        );

        // Handle UNION queries - they have a _next property for the next SELECT
        const statementWithNext = statement as unknown as StatementWithNext;
        let nextStatement = statementWithNext._next;
        while (nextStatement) {
          if (nextStatement.type === 'select') {
            extractColumnsFromStatement(nextStatement, tableColumnMap, cteNames);
          }
          nextStatement = nextStatement._next;
        }
      }
    }

    return tableColumnMap;
  } catch (error) {
    // Log the error for debugging but return empty map to allow validation to continue
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(
      `Failed to extract column references from SQL: ${errorMessage}. Column-level permissions cannot be validated.`
    );
    return new Map();
  }
}

/**
 * Helper function to extract columns from a SELECT statement
 */
function extractColumnsFromStatement(
  statement: Record<string, unknown>,
  tableColumnMap: Map<string, Set<string>>,
  cteNames: Set<string>,
  parentAliasMap?: Map<string, string>
): void {
  // Build table alias mapping and track all non-CTE tables
  // Include parent aliases for subqueries to resolve outer references
  const aliasToTableMap = new Map<string, string>(parentAliasMap || []);
  const physicalTables: string[] = [];

  // Process FROM clause
  if (statement.from && Array.isArray(statement.from)) {
    for (const fromItem of statement.from) {
      processFromItem(fromItem, aliasToTableMap, cteNames, physicalTables);
    }
  }

  // Track column aliases defined in SELECT clause
  // These should NOT be treated as physical columns when referenced in ORDER BY, GROUP BY, etc.
  const columnAliases = new Set<string>();

  // Extract columns from SELECT clause
  // Important: We only extract from the expression (column.expr), not from the alias (column.as)
  // This ensures column aliases like "AS total_count" are not treated as physical columns
  if (statement.columns && Array.isArray(statement.columns)) {
    for (const column of statement.columns) {
      // Track the alias if it exists
      if (column.as) {
        columnAliases.add(String(column.as).toLowerCase());
      }

      // Only process the expression part, which contains the actual column references
      // The 'as' property contains the alias which should not be treated as a column
      if (column.expr && typeof column.expr === 'object') {
        extractColumnFromExpression(
          column.expr,
          aliasToTableMap,
          tableColumnMap,
          cteNames,
          physicalTables,
          columnAliases
        );
      }
    }
  }

  // Extract columns from WHERE clause
  if (statement.where) {
    extractColumnFromExpression(
      statement.where,
      aliasToTableMap,
      tableColumnMap,
      cteNames,
      physicalTables,
      columnAliases
    );
  }

  // Extract columns from GROUP BY clause
  if (statement.groupby && Array.isArray(statement.groupby)) {
    for (const groupItem of statement.groupby) {
      // Skip if this is a reference to a column alias
      if (groupItem.type === 'column_ref' && groupItem.column && !groupItem.table) {
        const columnName =
          typeof groupItem.column === 'string' ? groupItem.column : String(groupItem.column);
        if (columnAliases.has(columnName.toLowerCase())) {
          continue; // Skip column aliases
        }
      }
      extractColumnFromExpression(
        groupItem,
        aliasToTableMap,
        tableColumnMap,
        cteNames,
        physicalTables,
        columnAliases
      );
    }
  }

  // Extract columns from HAVING clause
  if (statement.having) {
    extractColumnFromExpression(
      statement.having,
      aliasToTableMap,
      tableColumnMap,
      cteNames,
      physicalTables,
      columnAliases
    );
  }

  // Extract columns from ORDER BY clause
  if (statement.orderby && Array.isArray(statement.orderby)) {
    for (const orderItem of statement.orderby) {
      if (orderItem.expr) {
        // Check if this is a reference to a column alias
        if (
          orderItem.expr.type === 'column_ref' &&
          orderItem.expr.column &&
          !orderItem.expr.table
        ) {
          const columnName =
            typeof orderItem.expr.column === 'string'
              ? orderItem.expr.column
              : String(orderItem.expr.column);
          if (columnAliases.has(columnName.toLowerCase())) {
            continue; // Skip column aliases
          }
        }
        extractColumnFromExpression(
          orderItem.expr,
          aliasToTableMap,
          tableColumnMap,
          cteNames,
          physicalTables,
          columnAliases
        );
      }
    }
  }

  // Process nested CTEs
  if (statement.with && Array.isArray(statement.with)) {
    for (const cte of statement.with) {
      if (cte.stmt && typeof cte.stmt === 'object') {
        const cteStmt = cte.stmt as Record<string, unknown>;

        // Handle CTEs with UNION/UNION ALL - they have an ast property
        // Check for ast first since UNION CTEs don't have a direct type property
        if (!cteStmt.type && cteStmt.ast && typeof cteStmt.ast === 'object') {
          const ast = cteStmt.ast as Record<string, unknown>;
          if (ast.type === 'select') {
            // Process the first SELECT
            extractColumnsFromStatement(ast, tableColumnMap, cteNames, aliasToTableMap);

            // Process UNION parts (_next chain)
            let nextStmt = ast._next as Record<string, unknown> | undefined;
            while (nextStmt) {
              if (nextStmt.type === 'select') {
                extractColumnsFromStatement(nextStmt, tableColumnMap, cteNames, aliasToTableMap);
              }
              nextStmt = nextStmt._next as Record<string, unknown> | undefined;
            }
          }
        } else if (cteStmt.type === 'select') {
          // Regular CTE without UNION
          extractColumnsFromStatement(cteStmt, tableColumnMap, cteNames, aliasToTableMap);
        }
      }
    }
  }

  // Process JOIN conditions
  if (statement.from && Array.isArray(statement.from)) {
    for (const fromItem of statement.from) {
      // Process JOIN ON conditions (fromItem.join is the join type, fromItem.on is the condition)
      if (fromItem.join && fromItem.on) {
        extractColumnFromExpression(
          fromItem.on,
          aliasToTableMap,
          tableColumnMap,
          cteNames,
          physicalTables,
          columnAliases
        );
      }

      // Process subqueries in FROM clause
      if (fromItem.expr && typeof fromItem.expr === 'object' && fromItem.expr.type === 'select') {
        extractColumnsFromStatement(
          fromItem.expr as Record<string, unknown>,
          tableColumnMap,
          cteNames,
          aliasToTableMap
        );
      }
    }
  }
}

/**
 * Process FROM item to build alias mapping
 */
function processFromItem(
  fromItem: unknown,
  aliasToTableMap: Map<string, string>,
  cteNames: Set<string>,
  physicalTables?: string[]
): void {
  const item = fromItem as Record<string, unknown>;

  if (item.table) {
    const tableName = extractTableName(item.table);
    // Handle schema-qualified names (parser puts schema in 'db' field)
    const fullTableName = item.db ? `${item.db}.${tableName}` : tableName;
    const alias = item.as ? String(item.as) : tableName;

    if (!cteNames.has(tableName.toLowerCase())) {
      aliasToTableMap.set(alias.toLowerCase(), fullTableName);
      if (physicalTables) {
        physicalTables.push(fullTableName);
      }
    }
  }

  // Process JOINs
  if (item.join && Array.isArray(item.join)) {
    for (const joinItem of item.join) {
      if (joinItem.table) {
        const tableName = extractTableName(joinItem.table);
        // Handle schema-qualified names (parser puts schema in 'db' field)
        const fullTableName = joinItem.db ? `${joinItem.db}.${tableName}` : tableName;
        const alias = joinItem.as ? String(joinItem.as) : tableName;

        if (!cteNames.has(tableName.toLowerCase())) {
          aliasToTableMap.set(alias.toLowerCase(), fullTableName);
          if (physicalTables) {
            physicalTables.push(fullTableName);
          }
        }

        // Extract columns from JOIN conditions
        if (joinItem.on) {
          // JOIN conditions will be processed with the main extraction
        }
      }
    }
  }
}

/**
 * Extract table name from various formats
 */
function extractTableName(table: unknown): string {
  if (typeof table === 'string') {
    return table;
  }

  if (table && typeof table === 'object') {
    const tableObj = table as Record<string, unknown>;
    // Try different property names that might contain the table name
    const tableName = tableObj.table || tableObj.name || tableObj.value;
    return tableName ? String(tableName) : '';
  }

  return '';
}

/**
 * Extract column references from an expression
 */
function extractColumnFromExpression(
  expr: unknown,
  aliasToTableMap: Map<string, string>,
  tableColumnMap: Map<string, Set<string>>,
  cteNames: Set<string>,
  physicalTables?: string[],
  columnAliases?: Set<string>
): void {
  if (!expr || typeof expr !== 'object') return;

  const expression = expr as Record<string, unknown>;

  // Skip string literals and other non-column types
  if (
    expression.type === 'single_quote_string' ||
    expression.type === 'double_quote_string' ||
    expression.type === 'number' ||
    expression.type === 'bool' ||
    expression.type === 'null'
  ) {
    return;
  }

  // Handle column references
  if (expression.type === 'column_ref') {
    const columnName = expression.column;
    const tableRef = expression.table;

    if (columnName && columnName !== '*') {
      // Get the actual column name - handle both string and nested object formats
      let actualColumn: string;
      if (typeof columnName === 'string') {
        actualColumn = columnName.toLowerCase();
      } else if (typeof columnName === 'object' && columnName !== null) {
        // Handle nested object format from parser
        const colObj = columnName as Record<string, unknown>;

        // Check if it has the nested expr structure
        if (colObj.expr && typeof colObj.expr === 'object') {
          const exprObj = colObj.expr as Record<string, unknown>;
          // Skip string literals and non-column types
          if (
            exprObj.type === 'single_quote_string' ||
            exprObj.type === 'double_quote_string' ||
            exprObj.type === 'number' ||
            exprObj.type === 'bool' ||
            exprObj.type === 'null'
          ) {
            return;
          }
          // Make sure this is actually a column reference
          if (exprObj.type === 'default' || exprObj.type === 'column_ref') {
            const colValue = exprObj.value || exprObj.name;
            if (colValue !== undefined && colValue !== null) {
              actualColumn = String(colValue).toLowerCase();
            } else {
              // If we can't extract a value, skip this column
              return;
            }
          } else {
            // Unknown type, skip
            return;
          }
        } else {
          // Try direct properties as fallback
          const colValue = colObj.value || colObj.name || colObj.column;
          if (colValue !== undefined && colValue !== null) {
            actualColumn = String(colValue).toLowerCase();
          } else {
            // If we can't extract a value, skip this column
            return;
          }
        }
      } else {
        // Unknown format, skip
        return;
      }

      // Skip if this column is actually a column alias (not a physical column)
      // This handles cases where aliases are referenced in ORDER BY, GROUP BY, etc.
      if (!tableRef && columnAliases && columnAliases.has(actualColumn)) {
        return; // Skip column aliases
      }

      if (tableRef) {
        // Get table name from reference
        const tableName = extractTableName(tableRef).toLowerCase();

        // Check if it's an alias
        const actualTable = aliasToTableMap.get(tableName) || tableName;

        // Only track if not a CTE
        if (!cteNames.has(actualTable.toLowerCase())) {
          if (!tableColumnMap.has(actualTable)) {
            tableColumnMap.set(actualTable, new Set<string>());
          }
          const tableColumns = tableColumnMap.get(actualTable);
          if (tableColumns) {
            tableColumns.add(actualColumn);
          }
        }
      } else if (physicalTables && physicalTables.length > 0) {
        // If no table reference but we have physical tables, assign to first table
        // This handles simple queries like SELECT id, name FROM users
        const firstTable = physicalTables[0];
        if (firstTable && !cteNames.has(firstTable.toLowerCase())) {
          if (!tableColumnMap.has(firstTable)) {
            tableColumnMap.set(firstTable, new Set<string>());
          }
          const tableColumns = tableColumnMap.get(firstTable);
          if (tableColumns) {
            tableColumns.add(actualColumn);
          }
        }
      }
    }
  }

  // Handle aggregate functions
  if (expression.type === 'aggr_func' && expression.args) {
    if (Array.isArray(expression.args)) {
      for (const arg of expression.args) {
        extractColumnFromExpression(
          arg,
          aliasToTableMap,
          tableColumnMap,
          cteNames,
          physicalTables,
          columnAliases
        );
      }
    } else if (typeof expression.args === 'object') {
      const argsObj = expression.args as Record<string, unknown>;
      if (argsObj.expr) {
        // Handle nested expr structure in args
        extractColumnFromExpression(
          argsObj.expr,
          aliasToTableMap,
          tableColumnMap,
          cteNames,
          physicalTables,
          columnAliases
        );
      } else {
        extractColumnFromExpression(
          expression.args,
          aliasToTableMap,
          tableColumnMap,
          cteNames,
          physicalTables,
          columnAliases
        );
      }
    } else {
      extractColumnFromExpression(
        expression.args,
        aliasToTableMap,
        tableColumnMap,
        cteNames,
        physicalTables,
        columnAliases
      );
    }
  }

  // Handle binary expressions (e.g., col1 = col2)
  if (expression.type === 'binary_expr') {
    if (expression.left) {
      extractColumnFromExpression(
        expression.left,
        aliasToTableMap,
        tableColumnMap,
        cteNames,
        physicalTables,
        columnAliases
      );
    }
    if (expression.right) {
      extractColumnFromExpression(
        expression.right,
        aliasToTableMap,
        tableColumnMap,
        cteNames,
        physicalTables,
        columnAliases
      );
    }
  }

  // Handle expression lists (e.g., IN clauses with subqueries)
  if (expression.type === 'expr_list' && expression.value && Array.isArray(expression.value)) {
    for (const item of expression.value) {
      if (item.ast && item.ast.type === 'select') {
        // This is a subquery
        extractColumnsFromStatement(
          item.ast as Record<string, unknown>,
          tableColumnMap,
          cteNames,
          aliasToTableMap
        );
      } else {
        extractColumnFromExpression(
          item,
          aliasToTableMap,
          tableColumnMap,
          cteNames,
          physicalTables,
          columnAliases
        );
      }
    }
  }

  // Handle direct subqueries
  if (expression.type === 'select') {
    extractColumnsFromStatement(
      expression as Record<string, unknown>,
      tableColumnMap,
      cteNames,
      aliasToTableMap
    );
  }

  // Handle subqueries with ast property (as in SELECT column subqueries)
  if (expression.ast && typeof expression.ast === 'object') {
    const astObj = expression.ast as Record<string, unknown>;
    if (astObj.type === 'select') {
      extractColumnsFromStatement(astObj, tableColumnMap, cteNames, aliasToTableMap);
    }
  }

  // Handle window functions (e.g., LAG, LEAD, ROW_NUMBER with OVER clause)
  if (expression.type === 'window_func') {
    // Process the function arguments
    if (expression.args) {
      if (Array.isArray(expression.args)) {
        for (const arg of expression.args) {
          if (arg.value) {
            extractColumnFromExpression(
              arg.value,
              aliasToTableMap,
              tableColumnMap,
              cteNames,
              physicalTables,
              columnAliases
            );
          } else {
            extractColumnFromExpression(
              arg,
              aliasToTableMap,
              tableColumnMap,
              cteNames,
              physicalTables
            );
          }
        }
      } else if (typeof expression.args === 'object') {
        const argsObj = expression.args as Record<string, unknown>;
        // Handle expr_list for window functions
        if (argsObj.type === 'expr_list' && argsObj.value && Array.isArray(argsObj.value)) {
          for (const item of argsObj.value) {
            extractColumnFromExpression(
              item,
              aliasToTableMap,
              tableColumnMap,
              cteNames,
              physicalTables,
              columnAliases
            );
          }
        } else {
          extractColumnFromExpression(
            expression.args,
            aliasToTableMap,
            tableColumnMap,
            cteNames,
            physicalTables
          );
        }
      }
    }

    // Process the OVER clause
    if (expression.over && typeof expression.over === 'object') {
      const overObj = expression.over as Record<string, unknown>;

      // Handle PARTITION BY
      if (overObj.partitionby && Array.isArray(overObj.partitionby)) {
        for (const partItem of overObj.partitionby) {
          extractColumnFromExpression(
            partItem,
            aliasToTableMap,
            tableColumnMap,
            cteNames,
            physicalTables,
            columnAliases
          );
        }
      }

      // Handle ORDER BY
      if (overObj.orderby && Array.isArray(overObj.orderby)) {
        for (const orderItem of overObj.orderby) {
          if (orderItem && typeof orderItem === 'object') {
            const orderObj = orderItem as Record<string, unknown>;
            if (orderObj.expr) {
              extractColumnFromExpression(
                orderObj.expr,
                aliasToTableMap,
                tableColumnMap,
                cteNames,
                physicalTables,
                columnAliases
              );
            } else {
              extractColumnFromExpression(
                orderItem,
                aliasToTableMap,
                tableColumnMap,
                cteNames,
                physicalTables,
                columnAliases
              );
            }
          }
        }
      }
    }
  }

  // Handle function calls
  if (expression.type === 'function' && expression.args) {
    if (Array.isArray(expression.args)) {
      for (const arg of expression.args) {
        if (arg.value) {
          extractColumnFromExpression(
            arg.value,
            aliasToTableMap,
            tableColumnMap,
            cteNames,
            physicalTables,
            columnAliases
          );
        } else {
          extractColumnFromExpression(
            arg,
            aliasToTableMap,
            tableColumnMap,
            cteNames,
            physicalTables
          );
        }
      }
    } else if (typeof expression.args === 'object') {
      const argsObj = expression.args as Record<string, unknown>;
      // Handle expr_list for functions like EXISTS, etc.
      if (argsObj.type === 'expr_list' && argsObj.value && Array.isArray(argsObj.value)) {
        for (const item of argsObj.value) {
          // Check for subquery with ast property (EXISTS subqueries have this structure)
          const itemObj = item as Record<string, unknown>;
          if (itemObj?.ast && typeof itemObj.ast === 'object') {
            const astObj = itemObj.ast as Record<string, unknown>;
            if (astObj.type === 'select') {
              extractColumnsFromStatement(astObj, tableColumnMap, cteNames, aliasToTableMap);
            }
          } else {
            // Process any other expression type (including aggr_func, column_ref, etc.)
            extractColumnFromExpression(
              item,
              aliasToTableMap,
              tableColumnMap,
              cteNames,
              physicalTables,
              columnAliases
            );
          }
        }
      } else {
        extractColumnFromExpression(
          expression.args,
          aliasToTableMap,
          tableColumnMap,
          cteNames,
          physicalTables
        );
      }
    }

    // Handle window functions (OVER clause)
    if (expression.over && typeof expression.over === 'object') {
      const overObj = expression.over as Record<string, unknown>;
      if (overObj.as_window_specification && typeof overObj.as_window_specification === 'object') {
        const windowSpec = overObj.as_window_specification as Record<string, unknown>;
        if (
          windowSpec.window_specification &&
          typeof windowSpec.window_specification === 'object'
        ) {
          const spec = windowSpec.window_specification as Record<string, unknown>;

          // Handle PARTITION BY
          if (spec.partitionby && Array.isArray(spec.partitionby)) {
            for (const partItem of spec.partitionby) {
              extractColumnFromExpression(
                partItem,
                aliasToTableMap,
                tableColumnMap,
                cteNames,
                physicalTables
              );
            }
          }

          // Handle ORDER BY
          if (spec.orderby && Array.isArray(spec.orderby)) {
            for (const orderItem of spec.orderby) {
              if (orderItem.expr) {
                extractColumnFromExpression(
                  orderItem.expr,
                  aliasToTableMap,
                  tableColumnMap,
                  cteNames,
                  physicalTables
                );
              } else if (orderItem) {
                // Sometimes the orderItem itself might be the expression
                extractColumnFromExpression(
                  orderItem,
                  aliasToTableMap,
                  tableColumnMap,
                  cteNames,
                  physicalTables
                );
              }
            }
          }
        }
      }
    }
  }

  // Handle CASE expressions
  if (expression.type === 'case') {
    if (expression.expr) {
      extractColumnFromExpression(
        expression.expr,
        aliasToTableMap,
        tableColumnMap,
        cteNames,
        physicalTables,
        columnAliases
      );
    }
    if (expression.args && Array.isArray(expression.args)) {
      for (const arg of expression.args) {
        // Handle WHEN conditions
        if (arg.cond) {
          extractColumnFromExpression(
            arg.cond,
            aliasToTableMap,
            tableColumnMap,
            cteNames,
            physicalTables,
            columnAliases
          );
        }
        // Also handle older format
        if (arg.when) {
          extractColumnFromExpression(
            arg.when,
            aliasToTableMap,
            tableColumnMap,
            cteNames,
            physicalTables,
            columnAliases
          );
        }
        // Handle THEN results (may contain columns)
        if (arg.result) {
          extractColumnFromExpression(
            arg.result,
            aliasToTableMap,
            tableColumnMap,
            cteNames,
            physicalTables,
            columnAliases
          );
        }
        if (arg.then) {
          extractColumnFromExpression(
            arg.then,
            aliasToTableMap,
            tableColumnMap,
            cteNames,
            physicalTables,
            columnAliases
          );
        }
      }
    }
    if (expression.else) {
      extractColumnFromExpression(
        expression.else,
        aliasToTableMap,
        tableColumnMap,
        cteNames,
        physicalTables,
        columnAliases
      );
    }
  }
}
