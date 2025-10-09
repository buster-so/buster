/**
 * Query execution request
 */
export interface QueryRequest {
  /** SQL query string */
  sql: string;

  /** Query parameters for parameterized queries */
  params?: QueryParameter[];

  /** Optional warehouse name to route the query to */
  warehouse?: string;

  /** Query execution options */
  options?: QueryOptions;
}

/**
 * Query parameter type for parameterized queries
 */
export type QueryParameter =
  | string
  | number
  | boolean
  | null
  | Date
  | Buffer
  | string[]
  | number[]
  | boolean[];

/**
 * Query execution options
 */
export interface QueryOptions {
  /** Query timeout in milliseconds */
  timeout?: number;

  /** Maximum number of rows to return */
  maxRows?: number;

  /** Whether to stream results */
  stream?: boolean;

  /** Additional query-specific options - use specific types when possible */
  [key: string]: string | number | boolean | undefined;
}

/**
 * Query execution result
 */
export interface QueryResult<T = Record<string, unknown>> {
  /** Query execution success status */
  success: boolean;

  /** Result rows */
  rows: T[];

  /** Column metadata */
  columns: ColumnMetadata[];

  /** Number of rows affected (for DML operations) */
  rowsAffected?: number;

  /** Query execution time in milliseconds */
  executionTime: number;

  /** Warehouse that executed the query */
  warehouse: string;

  /** Error information if query failed */
  error?: QueryError;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Column metadata
 */
export interface ColumnMetadata {
  /** Column name */
  name: string;

  /** Column data type */
  type: string;

  /** Whether column allows null values */
  nullable: boolean;

  /** Column precision (for numeric types) */
  precision?: number;

  /** Column scale (for numeric types) */
  scale?: number;

  /** Column length (for string types) */
  length?: number;
}

/**
 * Query execution error
 */
export interface QueryError {
  /** Error code */
  code: string;

  /** Error message */
  message: string;

  /** SQL state (if applicable) */
  sqlState?: string;

  /** Stack trace */
  stack?: string;

  /** Additional error details */
  details?: Record<string, unknown>;
}

/**
 * Query routing strategy
 */
export enum RoutingStrategy {
  /** Route to specific warehouse */
  Specific = 'specific',

  /** Route based on query characteristics */
  Intelligent = 'intelligent',

  /** Round-robin across available warehouses */
  RoundRobin = 'round_robin',

  /** Route to least loaded warehouse */
  LeastLoaded = 'least_loaded',
}

/**
 * Query routing context
 */
export interface RoutingContext {
  /** Routing strategy to use */
  strategy: RoutingStrategy;

  /** Available warehouses for routing */
  availableWarehouses: string[];

  /** Query characteristics for intelligent routing */
  queryCharacteristics?: QueryCharacteristics;
}

/**
 * Query characteristics for intelligent routing
 */
export interface QueryCharacteristics {
  /** Estimated query complexity */
  complexity: 'low' | 'medium' | 'high';

  /** Query type */
  type: 'select' | 'insert' | 'update' | 'delete' | 'ddl' | 'dml';

  /** Tables referenced in the query */
  tables: string[];

  /** Estimated data volume */
  estimatedDataVolume?: 'small' | 'medium' | 'large';
}
