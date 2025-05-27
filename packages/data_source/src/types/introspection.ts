/**
 * Database introspection types for the data source package
 */

/**
 * Represents a database in a data source
 */
export interface Database {
  /** Database name */
  name: string;
  /** Database owner/creator */
  owner?: string;
  /** Database comment/description */
  comment?: string;
  /** Creation timestamp */
  created?: Date;
  /** Last modification timestamp */
  lastModified?: Date;
  /** Additional database-specific metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Represents a schema within a database
 */
export interface Schema {
  /** Schema name */
  name: string;
  /** Parent database name */
  database: string;
  /** Schema owner/creator */
  owner?: string;
  /** Schema comment/description */
  comment?: string;
  /** Creation timestamp */
  created?: Date;
  /** Last modification timestamp */
  lastModified?: Date;
  /** Additional schema-specific metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Table types supported across different data sources
 */
export type TableType =
  | 'TABLE'
  | 'VIEW'
  | 'MATERIALIZED_VIEW'
  | 'EXTERNAL_TABLE'
  | 'TEMPORARY_TABLE';

/**
 * Represents a table, view, or other relation in a schema
 */
export interface Table {
  /** Table name */
  name: string;
  /** Parent schema name */
  schema: string;
  /** Parent database name */
  database: string;
  /** Type of table/relation */
  type: TableType;
  /** Approximate row count */
  rowCount?: number;
  /** Size in bytes */
  sizeBytes?: number;
  /** Table comment/description */
  comment?: string;
  /** Creation timestamp */
  created?: Date;
  /** Last modification timestamp */
  lastModified?: Date;
  /** Clustering keys (for databases that support clustering) */
  clusteringKeys?: string[];
  /** Additional table-specific metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Represents a column in a table
 */
export interface Column {
  /** Column name */
  name: string;
  /** Parent table name */
  table: string;
  /** Parent schema name */
  schema: string;
  /** Parent database name */
  database: string;
  /** Ordinal position in table */
  position: number;
  /** Data type */
  dataType: string;
  /** Whether column allows null values */
  isNullable: boolean;
  /** Default value */
  defaultValue?: string;
  /** Maximum character length (for string types) */
  maxLength?: number;
  /** Numeric precision */
  precision?: number;
  /** Numeric scale */
  scale?: number;
  /** Column comment/description */
  comment?: string;
  /** Whether column is part of primary key */
  isPrimaryKey?: boolean;
  /** Whether column is part of a foreign key */
  isForeignKey?: boolean;
  /** Additional column-specific metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Represents a view definition
 */
export interface View {
  /** View name */
  name: string;
  /** Parent schema name */
  schema: string;
  /** Parent database name */
  database: string;
  /** View definition SQL */
  definition: string;
  /** View comment/description */
  comment?: string;
  /** Creation timestamp */
  created?: Date;
  /** Last modification timestamp */
  lastModified?: Date;
  /** Whether view is materialized */
  isMaterialized?: boolean;
  /** Additional view-specific metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Statistical information about a column
 */
export interface ColumnStatistics {
  /** Column name */
  columnName: string;
  /** Approximate distinct value count */
  distinctCount?: number;
  /** Null value count */
  nullCount?: number;
  /** Minimum value */
  minValue?: unknown;
  /** Maximum value */
  maxValue?: unknown;
  /** Average value (for numeric columns) */
  avgValue?: number;
  /** Most frequent values */
  topValues?: Array<{ value: unknown; frequency: number }>;
  /** Additional column-specific statistics */
  metadata?: Record<string, unknown>;
}

/**
 * Clustering information for tables that support clustering
 */
export interface ClusteringInfo {
  /** Clustering key columns */
  clusteringKeys: string[];
  /** Clustering depth (Snowflake-specific) */
  clusteringDepth?: number;
  /** Clustering width (Snowflake-specific) */
  clusteringWidth?: number;
  /** Additional clustering metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Comprehensive statistics for a table
 */
export interface TableStatistics {
  /** Table name */
  table: string;
  /** Parent schema name */
  schema: string;
  /** Parent database name */
  database: string;
  /** Approximate row count */
  rowCount?: number;
  /** Size in bytes */
  sizeBytes?: number;
  /** Statistics for each column */
  columnStatistics: ColumnStatistics[];
  /** Clustering information (if applicable) */
  clusteringInfo?: ClusteringInfo;
  /** Last statistics update timestamp */
  lastUpdated?: Date;
  /** Additional table-specific statistics */
  metadata?: Record<string, unknown>;
}

/**
 * Index information
 */
export interface Index {
  /** Index name */
  name: string;
  /** Parent table name */
  table: string;
  /** Parent schema name */
  schema: string;
  /** Parent database name */
  database: string;
  /** Index type */
  type: string;
  /** Columns included in the index */
  columns: string[];
  /** Whether index is unique */
  isUnique: boolean;
  /** Whether index is primary key */
  isPrimaryKey: boolean;
  /** Additional index metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Foreign key constraint information
 */
export interface ForeignKey {
  /** Constraint name */
  name: string;
  /** Source table */
  sourceTable: string;
  /** Source schema */
  sourceSchema: string;
  /** Source database */
  sourceDatabase: string;
  /** Source columns */
  sourceColumns: string[];
  /** Referenced table */
  referencedTable: string;
  /** Referenced schema */
  referencedSchema: string;
  /** Referenced database */
  referencedDatabase: string;
  /** Referenced columns */
  referencedColumns: string[];
  /** Additional constraint metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Complete introspection result for a data source
 */
export interface DataSourceIntrospectionResult {
  /** Data source name */
  dataSourceName: string;
  /** Data source type */
  dataSourceType: string;
  /** All databases */
  databases: Database[];
  /** All schemas */
  schemas: Schema[];
  /** All tables */
  tables: Table[];
  /** All columns */
  columns: Column[];
  /** All views */
  views: View[];
  /** All indexes */
  indexes?: Index[];
  /** All foreign keys */
  foreignKeys?: ForeignKey[];
  /** Introspection timestamp */
  introspectedAt: Date;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}
