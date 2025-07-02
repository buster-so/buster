import { Parser } from 'node-sql-parser';
import * as yaml from 'yaml';

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
    console.info('[extractPhysicalTables] Parsing SQL:', sql);
    
    // Parse SQL into AST
    const ast = parser.astify(sql);

    // Get all table references from parser
    // The parser returns tables in format "type::db::table" or "type::table"
    const allTables = parser.tableList(sql);
    console.info('[extractPhysicalTables] Raw table list from parser:', allTables);

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
      console.info('[extractPhysicalTables] Processing table reference:', tableRef);
      const parsed = parseTableReference(tableRef);
      console.info('[extractPhysicalTables] Parsed table:', JSON.stringify(parsed));

      // Skip if it's a CTE
      if (cteNames.has(parsed.table.toLowerCase())) {
        console.info('[extractPhysicalTables] Skipping CTE:', parsed.table);
        continue;
      }

      // Skip duplicates
      const tableKey = `${parsed.database || ''}.${parsed.schema || ''}.${parsed.table}`;
      if (processedTables.has(tableKey)) {
        console.info('[extractPhysicalTables] Skipping duplicate:', tableKey);
        continue;
      }

      processedTables.add(tableKey);
      physicalTables.push(parsed);
    }

    console.info('[extractPhysicalTables] Final physical tables:', JSON.stringify(physicalTables, null, 2));
    return physicalTables;
  } catch (error) {
    console.error('[extractPhysicalTables] Error parsing SQL:', error);
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
  console.info('[tablesMatch] Comparing tables:');
  console.info('[tablesMatch] Query table:', JSON.stringify(queryTable));
  console.info('[tablesMatch] Permission table:', JSON.stringify(permissionTable));
  
  // Exact table name must match
  if (queryTable.table.toLowerCase() !== permissionTable.table.toLowerCase()) {
    console.info('[tablesMatch] Table names do not match:', queryTable.table, 'vs', permissionTable.table);
    return false;
  }

  // If permission specifies schema, query must match
  if (permissionTable.schema && queryTable.schema) {
    if (permissionTable.schema.toLowerCase() !== queryTable.schema.toLowerCase()) {
      console.info('[tablesMatch] Schemas do not match:', queryTable.schema, 'vs', permissionTable.schema);
      return false;
    }
  }

  // If permission specifies database, query must match
  if (permissionTable.database && queryTable.database) {
    if (permissionTable.database.toLowerCase() !== queryTable.database.toLowerCase()) {
      console.info('[tablesMatch] Databases do not match:', queryTable.database, 'vs', permissionTable.database);
      return false;
    }
  }

  // If permission has schema but query doesn't, it's not a match
  // (we require explicit schema matching for security)
  if (permissionTable.schema && !queryTable.schema) {
    console.info('[tablesMatch] Permission requires schema but query has none');
    return false;
  }

  console.info('[tablesMatch] Tables match!');
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

  console.info('[extractTablesFromYml] Starting YML extraction');
  console.info('[extractTablesFromYml] YML content:', `${ymlContent.substring(0, 200)}...`);

  try {
    // Parse YML content
    const parsed = yaml.parse(ymlContent);
    console.info('[extractTablesFromYml] Parsed YML structure:', `${JSON.stringify(parsed, null, 2).substring(0, 500)}...`);

    // Check for flat format (top-level name, schema, database)
    if (parsed?.name && !parsed?.models && (parsed?.schema || parsed?.database)) {
      console.info('[extractTablesFromYml] Found flat format dataset');
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

      console.info('[extractTablesFromYml] Flat format table:', JSON.stringify(parsedTable));
      const key = normalizeTableIdentifier(parsedTable);
      if (!processedTables.has(key)) {
        processedTables.add(key);
        tables.push(parsedTable);
      }
    }

    // Look for models array
    if (parsed?.models && Array.isArray(parsed.models)) {
      console.info('[extractTablesFromYml] Found models array with', parsed.models.length, 'models');
      for (const model of parsed.models) {
        console.info('[extractTablesFromYml] Processing model:', JSON.stringify(model));
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

          console.info('[extractTablesFromYml] Parsed model table:', JSON.stringify(parsedTable));
          const key = normalizeTableIdentifier(parsedTable);
          if (!processedTables.has(key)) {
            processedTables.add(key);
            tables.push(parsedTable);
          }
        } else {
          console.warn('[extractTablesFromYml] Skipping model without schema/database:', JSON.stringify(model));
        }
      }
    }
  } catch (error) {
    // If YML parsing fails, return empty array
    console.error('[extractTablesFromYml] Failed to parse YML:', error);
  }

  console.info('[extractTablesFromYml] Total tables extracted:', tables.length);
  console.info('[extractTablesFromYml] Extracted tables:', JSON.stringify(tables, null, 2));
  return tables;
}
