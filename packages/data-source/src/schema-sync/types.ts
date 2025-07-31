/**
 * Types for schema sync functionality
 */

/**
 * Type of schema discrepancy
 */
export type DiscrepancyType =
  | 'missing_table'
  | 'missing_column'
  | 'type_mismatch'
  | 'unknown_column';

/**
 * Severity level of discrepancy
 */
export type DiscrepancySeverity = 'critical' | 'warning' | 'info';

/**
 * Schema discrepancy details
 */
export interface SchemaDiscrepancy {
  type: DiscrepancyType;
  severity: DiscrepancySeverity;
  datasetId: string;
  datasetName: string;
  tableName: string;
  columnName?: string;
  message: string;
  ymlValue?: string;
  databaseValue?: string;
  details?: {
    expectedType?: string;
    actualType?: string;
    ymlSource?: 'dimension' | 'measure';
  };
}
