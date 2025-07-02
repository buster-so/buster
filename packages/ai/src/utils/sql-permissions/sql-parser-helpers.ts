import { Parser } from 'node-sql-parser';
import * as yaml from 'yaml';

export interface ParsedTable {
  database?: string;
  schema?: string;
  table: string;
  fullName: string;
  alias?: string;
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
    throw new Error(
      `Failed to parse SQL: ${error instanceof Error ? error.message : 'Unknown error'}`
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
  } catch (_error) {
    // If YML parsing fails, return empty array
  }

  return tables;
}
