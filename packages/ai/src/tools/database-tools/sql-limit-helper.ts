/**
 * Helper function to ensure SQL statements have a LIMIT clause
 * This prevents data warehouses from returning excessive results
 */

/**
 * Ensures a SQL statement has a LIMIT clause, adding one if necessary
 * @param sql - The SQL statement to process
 * @param defaultLimit - The limit to add if none exists (default: 25)
 * @returns The SQL statement with a LIMIT clause
 */
export function ensureSqlLimit(sql: string, defaultLimit = 25): string {
  if (!sql || typeof sql !== 'string') {
    return sql;
  }

  // Trim whitespace
  let trimmedSql = sql.trim();

  // Check if SQL ends with semicolon
  const endsWithSemicolon = trimmedSql.endsWith(';');

  // Remove trailing semicolon for processing
  if (endsWithSemicolon) {
    trimmedSql = trimmedSql.slice(0, -1).trim();
  }

  // Check if the SQL already has a LIMIT clause
  // This regex looks for LIMIT followed by a number, with optional OFFSET or comma syntax
  // Matches: LIMIT 10, LIMIT 10 OFFSET 20, LIMIT 20, 10
  const limitRegex = /\bLIMIT\s+\d+(\s+OFFSET\s+\d+|\s*,\s*\d+)?\s*$/i;
  const hasLimit = limitRegex.test(trimmedSql);

  // If there's already a LIMIT, return the original SQL
  if (hasLimit) {
    return sql;
  }

  // Check if this is a SELECT statement (we only add LIMIT to SELECT queries)
  // Also handle CTEs (WITH clause) that contain SELECT
  // Handle SQL comments (-- and /* */)
  const cleanedSql = trimmedSql
    .replace(/--.*$/gm, '') // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments

  const isSelect = /^\s*(WITH\s+.*\s+)?SELECT\b/is.test(cleanedSql);
  if (!isSelect) {
    return sql;
  }

  // Add the LIMIT clause
  let modifiedSql = `${trimmedSql} LIMIT ${defaultLimit}`;

  // Re-add semicolon if it was present
  if (endsWithSemicolon) {
    modifiedSql += ';';
  }

  return modifiedSql;
}

/**
 * Process multiple SQL statements, ensuring each has a LIMIT clause
 * @param statements - Array of SQL statements
 * @param defaultLimit - The limit to add if none exists (default: 25)
 * @returns Array of SQL statements with LIMIT clauses
 */
export function ensureSqlLimitsForMultiple(statements: string[], defaultLimit = 25): string[] {
  return statements.map((statement) => ensureSqlLimit(statement, defaultLimit));
}
