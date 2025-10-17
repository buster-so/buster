import pkg from 'node-sql-parser';

const { Parser } = pkg;

export interface QueryTypeCheckResult {
  isReadOnly: boolean;
  queryType?: string;
  error?: string;
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
 * Checks if a SQL query is read-only (SELECT only, no INSERT/UPDATE/DELETE/DDL)
 * @param sql - The SQL query to validate
 * @param dataSourceSyntax - Optional data source syntax for dialect-specific parsing
 * @returns Result indicating if query is read-only with optional error message
 */
export function checkQueryIsReadOnly(sql: string, dataSourceSyntax?: string): QueryTypeCheckResult {
  const dialect = getParserDialect(dataSourceSyntax);
  const parser = new Parser();

  try {
    // Parse SQL into AST with the appropriate dialect
    const ast = parser.astify(sql, { database: dialect });

    // Handle single statement or array of statements
    const statements = Array.isArray(ast) ? ast : [ast];

    // Check each statement
    for (const statement of statements) {
      // Check if statement has a type property
      if ('type' in statement && statement.type) {
        const queryType = statement.type.toLowerCase();

        // Only allow SELECT statements
        if (queryType !== 'select') {
          // Provide specific guidance based on the query type
          let guidance = '';
          switch (queryType) {
            case 'insert':
              guidance = ' To read data, use SELECT statements instead of INSERT.';
              break;
            case 'update':
              guidance = ' To read data, use SELECT statements instead of UPDATE.';
              break;
            case 'delete':
              guidance = ' To read data, use SELECT statements instead of DELETE.';
              break;
            case 'create':
              guidance =
                ' DDL operations like CREATE are not permitted. Use SELECT to query existing data.';
              break;
            case 'drop':
              guidance =
                ' DDL operations like DROP are not permitted. Use SELECT to query existing data.';
              break;
            case 'alter':
              guidance =
                ' DDL operations like ALTER are not permitted. Use SELECT to query existing data.';
              break;
            case 'truncate':
              guidance =
                ' DDL operations like TRUNCATE are not permitted. Use SELECT to query existing data.';
              break;
            case 'grant':
            case 'revoke':
              guidance =
                ' Permission management statements are not allowed. Use SELECT statements to read data.';
              break;
            default:
              guidance = ' Please use SELECT statements to query data.';
          }

          return {
            isReadOnly: false,
            queryType,
            error: `Query type '${queryType.toUpperCase()}' is not allowed. Only SELECT statements are permitted for read-only access.${guidance}`,
          };
        }
      }
    }

    return {
      isReadOnly: true,
      queryType: 'select',
    };
  } catch (error) {
    // If we can't parse the SQL, err on the side of caution
    const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';

    // Check for common write operations in the raw SQL as a fallback
    const sqlLower = sql.toLowerCase();
    const writeKeywords = [
      'insert',
      'update',
      'delete',
      'create',
      'alter',
      'drop',
      'truncate',
      'grant',
      'revoke',
    ];

    for (const keyword of writeKeywords) {
      // Simple regex to check for keywords at word boundaries
      const regex = new RegExp(`\\b${keyword}\\b`);
      if (regex.test(sqlLower)) {
        return {
          isReadOnly: false,
          error: `Query appears to contain write operation (${keyword.toUpperCase()}). Only SELECT statements are allowed.`,
        };
      }
    }

    // If parsing failed, return error to be safe
    return {
      isReadOnly: false,
      error: `Failed to parse SQL query for validation: ${errorMessage}. Please ensure your SQL syntax is valid. Only SELECT statements are allowed for read-only access.`,
    };
  }
}
