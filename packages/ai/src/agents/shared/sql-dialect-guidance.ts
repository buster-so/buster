/**
 * SQL dialect-specific guidance for different database systems
 * Matches the constants from api/libs/agents/src/agents/modes/analysis.rs
 */

export const SQL_DIALECT_GUIDANCE = {
  postgres: `- **Date/Time Functions (PostgreSQL/Supabase)**:
  - **\`DATE_TRUNC\`**: Prefer \`DATE_TRUNC('day', column)\`, \`DATE_TRUNC('week', column)\`, \`DATE_TRUNC('month', column)\`, etc., for grouping time series data. Note that \`'week'\` starts on Monday.
  - **\`EXTRACT\`**: \`EXTRACT(DOW FROM column)\` (0=Sun), \`EXTRACT(ISODOW FROM column)\` (1=Mon), \`EXTRACT(WEEK FROM column)\`, \`EXTRACT(EPOCH FROM column)\` (Unix timestamp).
  - **Intervals**: Use \`INTERVAL '1 day'\`, \`INTERVAL '1 month'\`, etc.
  - **Current Date/Time**: \`CURRENT_DATE\`, \`CURRENT_TIMESTAMP\`, \`NOW()\`.
  - **Performance Tips**:
    - Use indexes on date columns: \`CREATE INDEX ON table (DATE_TRUNC('day', date_col))\` for frequent grouping
    - Prefer \`EXISTS\` over \`IN\` for subqueries with large result sets
    - Use \`LIMIT\` rather than fetching all rows when possible
    - For time ranges, use \`column >= start_date AND column < end_date\` (avoids timezone issues)
  - **String Handling**: Use \`ILIKE\` for case-insensitive matching, \`SIMILAR TO\` for regex patterns
  - **Aggregations**: Use \`FILTER (WHERE condition)\` for conditional aggregations instead of \`CASE WHEN\`
  - **JSON Operations**: PostgreSQL excels at JSON - use \`->\`, \`->>\`, \`@>\`, \`?\` operators for JSON queries
  - **Window Functions**: Powerful for analytics - \`LAG()\`, \`LEAD()\`, \`FIRST_VALUE()\`, \`PERCENT_RANK()\`
  - **Date Spine Example**: For complete time series, use \`generate_series()\`:
    \`\`\`sql
    WITH date_spine AS (
      SELECT generate_series(
        DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months'),
        DATE_TRUNC('month', CURRENT_DATE),
        INTERVAL '1 month'
      )::date AS period_date
    )
    SELECT 
      ds.period_date,
      COALESCE(SUM(t.amount), 0) AS total_amount
    FROM date_spine ds
    LEFT JOIN schema.transactions t ON DATE_TRUNC('month', t.date) = ds.period_date
    GROUP BY ds.period_date
    ORDER BY ds.period_date;
    \`\`\`
  - **Common Gotchas**: 
    - \`NOW()\` returns timestamp with timezone, \`CURRENT_TIMESTAMP\` is standard SQL
    - String concatenation: Use \`||\` not \`+\`
    - \`NULL\` comparisons: Use \`IS NULL\`/\`IS NOT NULL\`, never \`= NULL\``,

  snowflake: `- **Date/Time Functions (Snowflake)**:
  - **\`DATE_TRUNC\`**: Similar usage: \`DATE_TRUNC('DAY', column)\`, \`DATE_TRUNC('WEEK', column)\`, \`DATE_TRUNC('MONTH', column)\`. Week start depends on \`WEEK_START\` parameter (default Sunday).
  - **\`EXTRACT\`**: \`EXTRACT(dayofweek FROM column)\` (0=Sun), \`EXTRACT(dayofweekiso FROM column)\` (1=Mon), \`EXTRACT(weekiso FROM column)\`. Use \`DATE_PART\` for more options (e.g., \`DATE_PART('epoch_second', column)\`).
  - **DateAdd/DateDiff**: Use \`DATEADD(day, 1, column)\`, \`DATEDIFF(day, start_date, end_date)\`.
  - **Intervals**: Use \`INTERVAL '1 DAY'\`, \`INTERVAL '1 MONTH'\`.
  - **Current Date/Time**: \`CURRENT_DATE()\`, \`CURRENT_TIMESTAMP()\`, \`SYSDATE()\`.
  - **Performance Tips**:
    - Use \`QUALIFY\` for window function filtering (more efficient than subqueries)
    - For large tables, use \`SAMPLE\` for quick data exploration: \`SELECT * FROM table SAMPLE (10 PERCENT)\`
  - **String Functions**: \`ILIKE\` for case-insensitive, \`REGEXP_LIKE()\` for patterns, \`SPLIT_PART()\` for string splitting
  - **Semi-Structured Data**: Excellent JSON/XML support with \`VARIANT\` type, \`PARSE_JSON()\`, \`FLATTEN()\`
  - **Date Spine Example**: For complete time series, use table functions:
    \`\`\`sql
    WITH date_spine AS (
      SELECT DATEADD('month', ROW_NUMBER() OVER (ORDER BY NULL) - 1, 
             DATE_TRUNC('MONTH', DATEADD('month', -11, CURRENT_DATE()))) AS period_date
      FROM TABLE(GENERATOR(ROWCOUNT => 12))
    )
    SELECT 
      ds.period_date,
      COALESCE(SUM(t.amount), 0) AS total_amount
    FROM date_spine ds
    LEFT JOIN schema.transactions t ON DATE_TRUNC('MONTH', t.date) = ds.period_date
    GROUP BY ds.period_date
    ORDER BY ds.period_date;
    \`\`\`
  - **Common Gotchas**:
    - Column names are case-insensitive but stored uppercase unless quoted
    - Use \`||\` for string concatenation, not \`+\`
    - \`GENERATOR()\` is powerful but can consume credits quickly with large row counts`,

  bigquery: `- **Date/Time Functions (BigQuery)**:
  - **\`DATE_TRUNC\`**: \`DATE_TRUNC(column, DAY)\`, \`DATE_TRUNC(column, WEEK)\`, \`DATE_TRUNC(column, MONTH)\`, etc. Week starts Sunday by default, use \`WEEK(MONDAY)\` for Monday start.
  - **\`EXTRACT\`**: \`EXTRACT(DAYOFWEEK FROM column)\` (1=Sun, 7=Sat), \`EXTRACT(ISOWEEK FROM column)\`.
  - **DateAdd/DateDiff**: Use \`DATE_ADD(column, INTERVAL 1 DAY)\`, \`DATE_SUB(column, INTERVAL 1 MONTH)\`, \`DATE_DIFF(end_date, start_date, DAY)\`.
  - **Intervals**: Use \`INTERVAL 1 DAY\`, \`INTERVAL 1 MONTH\`.
  - **Current Date/Time**: \`CURRENT_DATE()\`, \`CURRENT_TIMESTAMP()\`, \`CURRENT_DATETIME()\`.
  - **Performance Tips**:
    - Partition tables by date: \`PARTITION BY DATE(timestamp_column)\` for better query performance
    - Use \`APPROX_COUNT_DISTINCT()\` for large datasets instead of exact counts
    - Avoid \`SELECT *\` - always specify columns to reduce slot usage
    - Use \`_TABLE_SUFFIX\` for wildcard table queries: \`FROM \`dataset.table_*\` WHERE _TABLE_SUFFIX BETWEEN '20230101' AND '20231231'\`
  - **String Functions**: \`REGEXP_EXTRACT()\`, \`SPLIT()\`, \`ARRAY_TO_STRING()\`, \`FORMAT()\` for string formatting
  - **Array/Struct Operations**: \`UNNEST()\` for array expansion, \`ARRAY_AGG()\` for aggregation into arrays
  - **Geographic Functions**: \`ST_GEOGPOINT()\`, \`ST_DISTANCE()\`, \`ST_WITHIN()\` for spatial analysis
  - **Cost Optimization**: Use \`LIMIT\` early, partition pruning, and clustering for cost control
  - **Date Spine Example**: For complete time series, use \`GENERATE_DATE_ARRAY()\`:
    \`\`\`sql
    WITH date_spine AS (
      SELECT period_date
      FROM UNNEST(GENERATE_DATE_ARRAY(
        DATE_TRUNC(DATE_SUB(CURRENT_DATE(), INTERVAL 11 MONTH), MONTH),
        DATE_TRUNC(CURRENT_DATE(), MONTH),
        INTERVAL 1 MONTH
      )) AS period_date
    )
    SELECT 
      ds.period_date,
      COALESCE(SUM(t.amount), 0) AS total_amount
    FROM date_spine ds
    LEFT JOIN \`project.dataset.transactions\` t ON DATE_TRUNC(t.date, MONTH) = ds.period_date
    GROUP BY ds.period_date
    ORDER BY ds.period_date;
    \`\`\`
  - **Common Gotchas**:
    - Table names must be quoted with backticks: \`project.dataset.table\`
    - String concatenation with \`CONCAT()\` function, not \`||\`
    - Slots are the currency - optimize for slot usage, not just time`,

  redshift: `- **Date/Time Functions (Redshift)**:
  - **\`DATE_TRUNC\`**: Similar to PostgreSQL: \`DATE_TRUNC('day', column)\`, \`DATE_TRUNC('week', column)\`, \`DATE_TRUNC('month', column)\`. Week starts Monday.
  - **\`EXTRACT\`**: \`EXTRACT(DOW FROM column)\` (0=Sun), \`EXTRACT(EPOCH FROM column)\`. Also supports \`DATE_PART\` (e.g., \`DATE_PART(w, column)\` for week).
  - **DateAdd/DateDiff**: Use \`DATEADD(day, 1, column)\`, \`DATEDIFF(day, start_date, end_date)\`.
  - **Intervals**: Use \`INTERVAL '1 day'\`, \`INTERVAL '1 month'\`.
  - **Current Date/Time**: \`GETDATE()\`, \`CURRENT_DATE\`, \`SYSDATE\`.
  - **Performance Tips**:
    - Use distribution keys (DISTKEY) and sort keys (SORTKEY) based on join and filter patterns
    - COMPOUND sort keys for multi-column sorting, INTERLEAVED for selective queries
    - Use \`ANALYZE\` after data loads to update table statistics for better query planning
    - Prefer \`COPY\` command over \`INSERT\` for bulk data loading
  - **String Functions**: \`ILIKE\` for case-insensitive, \`REGEXP_SUBSTR()\`, \`SPLIT_PART()\` for string operations
  - **Column Compression**: Automatically chooses compression encodings, but can specify manually
  - **Vacuum Operations**: Regular \`VACUUM\` and \`ANALYZE\` for optimal performance
  - **Concurrency**: Use workload management (WLM) to optimize query concurrency
  - **Date Spine Example**: For complete time series, use row numbers with dateadd:
    \`\`\`sql
    WITH date_spine AS (
      SELECT DATEADD(month, row_number() OVER (ORDER BY 1) - 1, 
             DATE_TRUNC('month', DATEADD(month, -11, GETDATE()))) AS period_date
      FROM (SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 
            UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8
            UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12) nums(n)
    )
    SELECT 
      ds.period_date,
      COALESCE(SUM(t.amount), 0) AS total_amount
    FROM date_spine ds
    LEFT JOIN schema.transactions t ON DATE_TRUNC('month', t.date) = ds.period_date
    GROUP BY ds.period_date
    ORDER BY ds.period_date;
    \`\`\`
  - **Common Gotchas**:
    - No support for arrays or complex data types
    - Limited regex support compared to PostgreSQL  
    - Case-sensitive string comparisons by default
    - \`LIMIT\` without \`ORDER BY\` returns unpredictable results`,

  mysql: `- **Date/Time Functions (MySQL/MariaDB)**:
  - **\`DATE_FORMAT\`**: Use \`DATE_FORMAT(column, '%Y-%m-01')\` for month truncation. For week, use \`STR_TO_DATE(CONCAT(YEAR(column),'-',WEEK(column, 1),' Monday'), '%X-%V %W')\` (Mode 1 starts week on Monday).
  - **\`EXTRACT\`**: \`EXTRACT(DAYOFWEEK FROM column)\` (1=Sun, 7=Sat), \`EXTRACT(WEEK FROM column)\`. \`UNIX_TIMESTAMP(column)\` for epoch seconds.
  - **DateAdd/DateDiff**: Use \`DATE_ADD(column, INTERVAL 1 DAY)\`, \`DATE_SUB(column, INTERVAL 1 MONTH)\`, \`DATEDIFF(end_date, start_date)\`.
  - **Intervals**: Use \`INTERVAL 1 DAY\`, \`INTERVAL 1 MONTH\`.
  - **Current Date/Time**: \`CURDATE()\`, \`NOW()\`, \`CURRENT_TIMESTAMP\`.
  - **String Functions**: \`REGEXP\` for pattern matching, \`SUBSTRING_INDEX()\` for splitting, \`CONCAT()\` for concatenation
  - **JSON Support**: \`JSON_EXTRACT()\`, \`JSON_UNQUOTE()\`, \`JSON_ARRAY()\` for JSON operations (MySQL 5.7+)
  - **Date Spine Example**: For complete time series, use recursive CTE or number series:
    \`\`\`sql
    WITH RECURSIVE date_spine AS (
      SELECT DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 11 MONTH), '%Y-%m-01') AS period_date
      UNION ALL
      SELECT DATE_ADD(period_date, INTERVAL 1 MONTH)
      FROM date_spine
      WHERE period_date < DATE_FORMAT(CURDATE(), '%Y-%m-01')
    )
    SELECT 
      ds.period_date,
      COALESCE(SUM(t.amount), 0) AS total_amount
    FROM date_spine ds
    LEFT JOIN schema.transactions t ON DATE_FORMAT(t.date, '%Y-%m-01') = ds.period_date
    GROUP BY ds.period_date
    ORDER BY ds.period_date;
    \`\`\`
  - **Common Gotchas**:
    - \`LIMIT\` without \`ORDER BY\` returns unpredictable results
    - String comparison is case-insensitive by default (depends on collation)
    - Use \`CONCAT()\` for string concatenation, not \`+\`
    - \`GROUP BY\` behavior differs from standard SQL (sql_mode affects this)`,

  mariadb: `- **Date/Time Functions (MySQL/MariaDB)**:
  - **\`DATE_FORMAT\`**: Use \`DATE_FORMAT(column, '%Y-%m-01')\` for month truncation. For week, use \`STR_TO_DATE(CONCAT(YEAR(column),'-',WEEK(column, 1),' Monday'), '%X-%V %W')\` (Mode 1 starts week on Monday).
  - **\`EXTRACT\`**: \`EXTRACT(DAYOFWEEK FROM column)\` (1=Sun, 7=Sat), \`EXTRACT(WEEK FROM column)\`. \`UNIX_TIMESTAMP(column)\` for epoch seconds.
  - **DateAdd/DateDiff**: Use \`DATE_ADD(column, INTERVAL 1 DAY)\`, \`DATE_SUB(column, INTERVAL 1 MONTH)\`, \`DATEDIFF(end_date, start_date)\`.
  - **Intervals**: Use \`INTERVAL 1 DAY\`, \`INTERVAL 1 MONTH\`.
  - **Current Date/Time**: \`CURDATE()\`, \`NOW()\`, \`CURRENT_TIMESTAMP\`.
  - **Performance Tips**: Same as MySQL plus MariaDB-specific optimizations like improved optimizer
  - **String Functions**: Enhanced regex support compared to MySQL, \`CONCAT_WS()\` for separator-based concatenation
  - **Date Spine Example**: For complete time series, use recursive CTE or number series:
    \`\`\`sql
    WITH RECURSIVE date_spine AS (
      SELECT DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 11 MONTH), '%Y-%m-01') AS period_date
      UNION ALL
      SELECT DATE_ADD(period_date, INTERVAL 1 MONTH)
      FROM date_spine
      WHERE period_date < DATE_FORMAT(CURDATE(), '%Y-%m-01')
    )
    SELECT 
      ds.period_date,
      COALESCE(SUM(t.amount), 0) AS total_amount
    FROM date_spine ds
    LEFT JOIN schema.transactions t ON DATE_FORMAT(t.date, '%Y-%m-01') = ds.period_date
    GROUP BY ds.period_date
    ORDER BY ds.period_date;
    \`\`\`
  - **Common Gotchas**: Generally more standards-compliant than MySQL, but same basic patterns apply`,

  sqlserver: `- **Date/Time Functions (SQL Server)**:
  - **\`DATE_TRUNC\`**: Available in recent versions: \`DATE_TRUNC('day', column)\`, \`DATE_TRUNC('week', column)\`, \`DATE_TRUNC('month', column)\`. Week start depends on \`DATEFIRST\` setting.
  - **\`DATEPART\`**: \`DATEPART(weekday, column)\`, \`DATEPART(iso_week, column)\`, \`DATEPART(epoch, column)\` (requires user function usually).
  - **DateAdd/DateDiff**: Use \`DATEADD(day, 1, column)\`, \`DATEDIFF(day, start_date, end_date)\`.
  - **Intervals**: Generally handled by \`DATEADD\`/\`DATEDIFF\`.
  - **Current Date/Time**: \`GETDATE()\`, \`SYSDATETIME()\`, \`CURRENT_TIMESTAMP\`.
  - **String Functions**: \`CHARINDEX()\`, \`SUBSTRING()\`, \`REPLACE()\`, \`CONCAT()\` for string operations
  - **Window Functions**: Advanced analytics with \`OVER()\` clause, \`LAG()\`, \`LEAD()\`, \`ROW_NUMBER()\`
  - **JSON Support**: \`OPENJSON()\`, \`JSON_VALUE()\`, \`JSON_QUERY()\` for JSON operations (SQL Server 2016+)
  - **Memory-Optimized Tables**: In-memory OLTP for high-performance scenarios
  - **Date Spine Example**: For complete time series, use recursive CTE or VALUES table:
    \`\`\`sql
    WITH date_spine AS (
      SELECT DATEADD(month, n.num, 
             DATEADD(month, DATEDIFF(month, 0, DATEADD(month, -11, GETDATE())), 0)) AS period_date
      FROM (VALUES (0),(1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11)) n(num)
    )
    SELECT 
      ds.period_date,
      COALESCE(SUM(t.amount), 0) AS total_amount
    FROM date_spine ds
    LEFT JOIN schema.transactions t ON DATEADD(month, DATEDIFF(month, 0, t.date), 0) = ds.period_date
    GROUP BY ds.period_date
    ORDER BY ds.period_date;
    \`\`\`
  - **Common Gotchas**:
    - Square bracket notation for reserved words: \`[order]\`, \`[user]\`
    - String concatenation with \`+\` can return NULL if any operand is NULL
    - \`ISNULL()\` function vs \`IS NULL\` condition
    - \`TOP\` clause requires \`ORDER BY\` for deterministic results`,

  databricks: `- **Date/Time Functions (Databricks SQL)**:
  - **\`DATE_TRUNC\`**: \`DATE_TRUNC('DAY', column)\`, \`DATE_TRUNC('WEEK', column)\`, \`DATE_TRUNC('MONTH', column)\`. Week starts Monday.
  - **\`EXTRACT\`**: \`EXTRACT(DAYOFWEEK FROM column)\` (1=Sun, 7=Sat), \`EXTRACT(WEEK FROM column)\`. \`unix_timestamp(column)\` for epoch seconds.
  - **DateAdd/DateDiff**: Use \`date_add(column, 1)\`, \`date_sub(column, 30)\`, \`datediff(end_date, start_date)\`.
  - **Intervals**: Use \`INTERVAL 1 DAY\`, \`INTERVAL 1 MONTH\`.
  - **Current Date/Time**: \`current_date()\`, \`current_timestamp()\`.
  - **Array Functions**: \`array_contains()\`, \`array_distinct()\`, \`flatten()\`, \`sequence()\` for array operations
  - **String Functions**: \`regexp_extract()\`, \`split()\`, \`concat_ws()\` for string manipulation
  - **Delta Lake Features**: Time travel with \`@v123\` or \`TIMESTAMP AS OF\`, ACID transactions
  - **ML Integration**: Built-in MLflow integration, \`ML.PREDICT()\` for model inference
  - **Date Spine Example**: For complete time series, use sequence function:
    \`\`\`sql
    WITH date_spine AS (
      SELECT add_months(DATE_TRUNC('MONTH', add_months(current_date(), -11)), n) AS period_date
      FROM (SELECT explode(sequence(0, 11)) AS n)
    )
    SELECT 
      ds.period_date,
      COALESCE(SUM(t.amount), 0) AS total_amount
    FROM date_spine ds
    LEFT JOIN schema.transactions t ON DATE_TRUNC('MONTH', t.date) = ds.period_date
    GROUP BY ds.period_date
    ORDER BY ds.period_date;
    \`\`\`
  - **Common Gotchas**:
    - Case-sensitive column names by default (unlike some SQL dialects)
    - Use \`concat()\` function for string concatenation, not \`||\` or \`+\`
    - \`sequence()\` function is powerful but can be memory-intensive for large ranges
    - Delta Lake tables require explicit \`REFRESH TABLE\` after external writes`,

  supabase: `- **Date/Time Functions (PostgreSQL/Supabase)**:
  - **\`DATE_TRUNC\`**: Prefer \`DATE_TRUNC('day', column)\`, \`DATE_TRUNC('week', column)\`, \`DATE_TRUNC('month', column)\`, etc., for grouping time series data. Note that \`'week'\` starts on Monday.
  - **\`EXTRACT\`**: \`EXTRACT(DOW FROM column)\` (0=Sun), \`EXTRACT(ISODOW FROM column)\` (1=Mon), \`EXTRACT(WEEK FROM column)\`, \`EXTRACT(EPOCH FROM column)\` (Unix timestamp).
  - **Intervals**: Use \`INTERVAL '1 day'\`, \`INTERVAL '1 month'\`, etc.
  - **Current Date/Time**: \`CURRENT_DATE\`, \`CURRENT_TIMESTAMP\`, \`NOW()\`.
  - **Date Spine Example**: For complete time series, use \`generate_series()\`:
    \`\`\`sql
    WITH date_spine AS (
      SELECT generate_series(
        DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months'),
        DATE_TRUNC('month', CURRENT_DATE),
        INTERVAL '1 month'
      )::date AS period_date
    )
    SELECT 
      ds.period_date,
      COALESCE(SUM(t.amount), 0) AS total_amount
    FROM date_spine ds
    LEFT JOIN schema.transactions t ON DATE_TRUNC('month', t.date) = ds.period_date
    GROUP BY ds.period_date
    ORDER BY ds.period_date;
    \`\`\``,
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
