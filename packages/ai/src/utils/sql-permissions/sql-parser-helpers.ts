import { Parser } from 'node-sql-parser';

export interface ParsedTable {
  database?: string;
  schema?: string;
  table: string;
  fullName: string;
  alias?: string;
}

/**
 * Extracts physical tables from SQL query, excluding CTEs
 * Returns database.schema.table references with proper qualification
 */
export function extractPhysicalTables(sql: string): ParsedTable[] {
  const parser = new Parser();

  try {
    // Parse SQL into AST
    const ast = parser.astify(sql);

    // Get all table references from parser
    // The parser returns tables in format "type::db::table" or "type::table"
    const allTables = parser.tableList(sql);

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
 * Looks for patterns like:
 * - table_name: schema.table
 * - table_name: "schema.table"
 * - sql_table_name: schema.table
 */
export function extractTablesFromYml(ymlContent: string): ParsedTable[] {
  const tables: ParsedTable[] = [];
  const processedTables = new Set<string>();

  // Match various table name patterns in YML
  const patterns = [
    /table_name:\s*["']?([^"'\n]+)["']?/g,
    /sql_table_name:\s*["']?([^"'\n]+)["']?/g,
    /from:\s*["']?([^"'\n]+)["']?/g,
  ];

  for (const pattern of patterns) {
    const matches = ymlContent.matchAll(pattern);

    for (const match of matches) {
      if (match[1]) {
        const tableRef = match[1].trim();
        const parsed = parseTableReference(tableRef);
        const key = normalizeTableIdentifier(parsed);

        if (!processedTables.has(key)) {
          processedTables.add(key);
          tables.push(parsed);
        }
      }
    }
  }

  return tables;
}
