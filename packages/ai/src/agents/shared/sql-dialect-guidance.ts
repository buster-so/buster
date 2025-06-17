/**
 * SQL dialect-specific guidance for different database systems
 * Matches the constants from api/libs/agents/src/agents/modes/analysis.rs
 */

export const SQL_DIALECT_GUIDANCE = {
  postgres: `- **Date/Time Functions (PostgreSQL/Supabase)**:
  - **\`DATE_TRUNC\`**: Prefer \`DATE_TRUNC('day', column)\`, \`DATE_TRUNC('week', column)\`, \`DATE_TRUNC('month', column)\`, etc., for grouping time series data. Note that \`'week'\` starts on Monday.
  - **\`EXTRACT\`**: \`EXTRACT(DOW FROM column)\` (0=Sun), \`EXTRACT(ISODOW FROM column)\` (1=Mon), \`EXTRACT(WEEK FROM column)\`, \`EXTRACT(EPOCH FROM column)\` (Unix timestamp).
  - **Intervals**: Use \`INTERVAL '1 day'\`, \`INTERVAL '1 month'\`, etc.
  - **Current Date/Time**: \`CURRENT_DATE\`, \`CURRENT_TIMESTAMP\`, \`NOW()\`.`,

  snowflake: `- **Date/Time Functions (Snowflake)**:
  - **\`DATE_TRUNC\`**: Similar usage: \`DATE_TRUNC('DAY', column)\`, \`DATE_TRUNC('WEEK', column)\`, \`DATE_TRUNC('MONTH', column)\`. Week start depends on \`WEEK_START\` parameter (default Sunday).
  - **\`EXTRACT\`**: \`EXTRACT(dayofweek FROM column)\` (0=Sun), \`EXTRACT(dayofweekiso FROM column)\` (1=Mon), \`EXTRACT(weekiso FROM column)\`. Use \`DATE_PART\` for more options (e.g., \`DATE_PART('epoch_second', column)\`).
  - **DateAdd/DateDiff**: Use \`DATEADD(day, 1, column)\`, \`DATEDIFF(day, start_date, end_date)\`.
  - **Intervals**: Use \`INTERVAL '1 DAY'\`, \`INTERVAL '1 MONTH'\`.
  - **Current Date/Time**: \`CURRENT_DATE()\`, \`CURRENT_TIMESTAMP()\`, \`SYSDATE()\`.`,

  bigquery: `- **Date/Time Functions (BigQuery)**:
  - **\`DATE_TRUNC\`**: \`DATE_TRUNC(column, DAY)\`, \`DATE_TRUNC(column, WEEK)\`, \`DATE_TRUNC(column, MONTH)\`, etc. Week starts Sunday by default, use \`WEEK(MONDAY)\` for Monday start.
  - **\`EXTRACT\`**: \`EXTRACT(DAYOFWEEK FROM column)\` (1=Sun, 7=Sat), \`EXTRACT(ISOWEEK FROM column)\`.
  - **DateAdd/DateDiff**: Use \`DATE_ADD(column, INTERVAL 1 DAY)\`, \`DATE_SUB(column, INTERVAL 1 MONTH)\`, \`DATE_DIFF(end_date, start_date, DAY)\`.
  - **Intervals**: Use \`INTERVAL 1 DAY\`, \`INTERVAL 1 MONTH\`.
  - **Current Date/Time**: \`CURRENT_DATE()\`, \`CURRENT_TIMESTAMP()\`, \`CURRENT_DATETIME()\`.`,

  redshift: `- **Date/Time Functions (Redshift)**:
  - **\`DATE_TRUNC\`**: Similar to PostgreSQL: \`DATE_TRUNC('day', column)\`, \`DATE_TRUNC('week', column)\`, \`DATE_TRUNC('month', column)\`. Week starts Monday.
  - **\`EXTRACT\`**: \`EXTRACT(DOW FROM column)\` (0=Sun), \`EXTRACT(EPOCH FROM column)\`. Also supports \`DATE_PART\` (e.g., \`DATE_PART(w, column)\` for week).
  - **DateAdd/DateDiff**: Use \`DATEADD(day, 1, column)\`, \`DATEDIFF(day, start_date, end_date)\`.
  - **Intervals**: Use \`INTERVAL '1 day'\`, \`INTERVAL '1 month'\`.
  - **Current Date/Time**: \`GETDATE()\`, \`CURRENT_DATE\`, \`SYSDATE\`.`,

  mysql: `- **Date/Time Functions (MySQL/MariaDB)**:
  - **\`DATE_FORMAT\`**: Use \`DATE_FORMAT(column, '%Y-%m-01')\` for month truncation. For week, use \`STR_TO_DATE(CONCAT(YEAR(column),'-',WEEK(column, 1),' Monday'), '%X-%V %W')\` (Mode 1 starts week on Monday).
  - **\`EXTRACT\`**: \`EXTRACT(DAYOFWEEK FROM column)\` (1=Sun, 7=Sat), \`EXTRACT(WEEK FROM column)\`. \`UNIX_TIMESTAMP(column)\` for epoch seconds.
  - **DateAdd/DateDiff**: Use \`DATE_ADD(column, INTERVAL 1 DAY)\`, \`DATE_SUB(column, INTERVAL 1 MONTH)\`, \`DATEDIFF(end_date, start_date)\`.
  - **Intervals**: Use \`INTERVAL 1 DAY\`, \`INTERVAL 1 MONTH\`.
  - **Current Date/Time**: \`CURDATE()\`, \`NOW()\`, \`CURRENT_TIMESTAMP\`.`,

  mariadb: `- **Date/Time Functions (MySQL/MariaDB)**:
  - **\`DATE_FORMAT\`**: Use \`DATE_FORMAT(column, '%Y-%m-01')\` for month truncation. For week, use \`STR_TO_DATE(CONCAT(YEAR(column),'-',WEEK(column, 1),' Monday'), '%X-%V %W')\` (Mode 1 starts week on Monday).
  - **\`EXTRACT\`**: \`EXTRACT(DAYOFWEEK FROM column)\` (1=Sun, 7=Sat), \`EXTRACT(WEEK FROM column)\`. \`UNIX_TIMESTAMP(column)\` for epoch seconds.
  - **DateAdd/DateDiff**: Use \`DATE_ADD(column, INTERVAL 1 DAY)\`, \`DATE_SUB(column, INTERVAL 1 MONTH)\`, \`DATEDIFF(end_date, start_date)\`.
  - **Intervals**: Use \`INTERVAL 1 DAY\`, \`INTERVAL 1 MONTH\`.
  - **Current Date/Time**: \`CURDATE()\`, \`NOW()\`, \`CURRENT_TIMESTAMP\`.`,

  sqlserver: `- **Date/Time Functions (SQL Server)**:
  - **\`DATE_TRUNC\`**: Available in recent versions: \`DATE_TRUNC('day', column)\`, \`DATE_TRUNC('week', column)\`, \`DATE_TRUNC('month', column)\`. Week start depends on \`DATEFIRST\` setting.
  - **\`DATEPART\`**: \`DATEPART(weekday, column)\`, \`DATEPART(iso_week, column)\`, \`DATEPART(epoch, column)\` (requires user function usually).
  - **DateAdd/DateDiff**: Use \`DATEADD(day, 1, column)\`, \`DATEDIFF(day, start_date, end_date)\`.
  - **Intervals**: Generally handled by \`DATEADD\`/\`DATEDIFF\`.
  - **Current Date/Time**: \`GETDATE()\`, \`SYSDATETIME()\`, \`CURRENT_TIMESTAMP\`.`,

  databricks: `- **Date/Time Functions (Databricks SQL)**:
  - **\`DATE_TRUNC\`**: \`DATE_TRUNC('DAY', column)\`, \`DATE_TRUNC('WEEK', column)\`, \`DATE_TRUNC('MONTH', column)\`. Week starts Monday.
  - **\`EXTRACT\`**: \`EXTRACT(DAYOFWEEK FROM column)\` (1=Sun, 7=Sat), \`EXTRACT(WEEK FROM column)\`. \`unix_timestamp(column)\` for epoch seconds.
  - **DateAdd/DateDiff**: Use \`date_add(column, 1)\`, \`date_sub(column, 30)\`, \`datediff(end_date, start_date)\`.
  - **Intervals**: Use \`INTERVAL 1 DAY\`, \`INTERVAL 1 MONTH\`.
  - **Current Date/Time**: \`current_date()\`, \`current_timestamp()\`.`,

  supabase: `- **Date/Time Functions (PostgreSQL/Supabase)**:
  - **\`DATE_TRUNC\`**: Prefer \`DATE_TRUNC('day', column)\`, \`DATE_TRUNC('week', column)\`, \`DATE_TRUNC('month', column)\`, etc., for grouping time series data. Note that \`'week'\` starts on Monday.
  - **\`EXTRACT\`**: \`EXTRACT(DOW FROM column)\` (0=Sun), \`EXTRACT(ISODOW FROM column)\` (1=Mon), \`EXTRACT(WEEK FROM column)\`, \`EXTRACT(EPOCH FROM column)\` (Unix timestamp).
  - **Intervals**: Use \`INTERVAL '1 day'\`, \`INTERVAL '1 month'\`, etc.
  - **Current Date/Time**: \`CURRENT_DATE\`, \`CURRENT_TIMESTAMP\`, \`NOW()\`.`,
} as const;

export type SqlDialect = keyof typeof SQL_DIALECT_GUIDANCE;

/**
 * Get SQL dialect guidance for a given database type
 * @param dialect - The SQL dialect/database type
 * @returns SQL guidance string for the specified dialect
 */
export function getSqlDialectGuidance(dialect?: string | null): string {
  if (!dialect) {
    return SQL_DIALECT_GUIDANCE.postgres;
  }

  const normalizedDialect = dialect.toLowerCase() as SqlDialect;
  return SQL_DIALECT_GUIDANCE[normalizedDialect] || SQL_DIALECT_GUIDANCE.postgres;
}
