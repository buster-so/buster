import type { Column } from '../types/introspection';
import type { DiscrepancySeverity, DiscrepancyType, SchemaDiscrepancy } from './types';
import type { YmlColumnInfo } from './yml-parser';

/**
 * Normalized column for comparison
 */
interface NormalizedColumn {
  name: string;
  type: string;
  source: 'database' | 'yml';
  originalName: string;
}

/**
 * Compare introspected schema columns with YML-defined columns
 * @param introspectedColumns Columns from database introspection
 * @param ymlColumns Columns from YML definition
 * @param datasetInfo Context about the dataset
 * @returns Array of discrepancies found
 */
export function compareSchemaWithYml(
  introspectedColumns: Column[],
  ymlColumns: YmlColumnInfo[],
  datasetInfo: {
    datasetId: string;
    datasetName: string;
    tableName: string;
  }
): SchemaDiscrepancy[] {
  const discrepancies: SchemaDiscrepancy[] = [];

  // Log raw inputs for debugging
  console.info(`[Schema Comparator] Starting comparison for dataset ${datasetInfo.datasetName}`, {
    datasetId: datasetInfo.datasetId,
    tableName: datasetInfo.tableName,
    ymlColumnsCount: ymlColumns.length,
    introspectedColumnsCount: introspectedColumns.length,
    ymlColumns: ymlColumns.map(c => ({ name: c.name, type: c.type, source: c.source })),
    introspectedColumns: introspectedColumns.map(c => ({ name: c.name, type: c.dataType })),
  });

  // Normalize columns for comparison
  const normalizedIntrospected = normalizeIntrospectedColumns(introspectedColumns);
  const normalizedYml = normalizeYmlColumns(ymlColumns);

  console.info(`[Schema Comparator] After normalization`, {
    normalizedYml: normalizedYml.map(c => ({ name: c.name, type: c.type, originalName: c.originalName })),
    normalizedIntrospected: normalizedIntrospected.map(c => ({ name: c.name, type: c.type, originalName: c.originalName })),
  });

  // Create maps for efficient lookup
  const introspectedMap = new Map(normalizedIntrospected.map((col) => [col.name, col]));
  // Map not needed for current implementation, but keeping for potential future use
  // const ymlMap = new Map(normalizedYml.map((col) => [col.name, col]));

  // Check for missing columns (in YML but not in database)
  for (const ymlCol of normalizedYml) {
    console.info(`[Schema Comparator] Checking YML column '${ymlCol.originalName}'`, {
      normalizedName: ymlCol.name,
      ymlType: ymlCol.type,
      foundInDb: introspectedMap.has(ymlCol.name),
    });

    if (!introspectedMap.has(ymlCol.name)) {
      discrepancies.push({
        type: 'missing_column' as DiscrepancyType,
        severity: 'critical' as DiscrepancySeverity,
        datasetId: datasetInfo.datasetId,
        datasetName: datasetInfo.datasetName,
        tableName: datasetInfo.tableName,
        columnName: ymlCol.originalName,
        ymlValue: ymlCol.type,
        message: `Column '${ymlCol.originalName}' defined in YML not found in database`,
      });
    } else {
      // Check for type mismatches
      const dbCol = introspectedMap.get(ymlCol.name);
      if (!dbCol) continue;
      const typesMatch = doTypesMatch(dbCol.type, ymlCol.type);

      console.info(`[Schema Comparator] Type comparison for column '${ymlCol.originalName}'`, {
        ymlType: ymlCol.type,
        dbType: dbCol.type,
        originalDbType: dbCol.originalName,
        typesMatch: typesMatch,
      });

      if (!typesMatch) {
        console.warn(`[Schema Comparator] Type mismatch detected for column '${ymlCol.originalName}'`, {
          ymlType: ymlCol.type,
          dbType: dbCol.type,
        });
        discrepancies.push({
          type: 'type_mismatch' as DiscrepancyType,
          severity: 'warning' as DiscrepancySeverity,
          datasetId: datasetInfo.datasetId,
          datasetName: datasetInfo.datasetName,
          tableName: datasetInfo.tableName,
          columnName: ymlCol.originalName,
          ymlValue: ymlCol.type,
          databaseValue: dbCol.type,
          message: `Column '${ymlCol.originalName}' has type '${ymlCol.type}' in YML but '${dbCol.type}' in database`,
        });
      }
    }
  }

  console.info(`[Schema Comparator] Comparison complete for dataset ${datasetInfo.datasetName}`, {
    discrepanciesFound: discrepancies.length,
    discrepancies: discrepancies.map(d => ({
      type: d.type,
      severity: d.severity,
      column: d.columnName,
      message: d.message,
    })),
  });

  return discrepancies;
}

/**
 * Categorize discrepancies by severity and type
 * @param discrepancies Array of discrepancies
 * @returns Categorized discrepancies
 */
export function categorizeDiscrepancies(discrepancies: SchemaDiscrepancy[]): {
  critical: SchemaDiscrepancy[];
  warning: SchemaDiscrepancy[];
  info: SchemaDiscrepancy[];
  byType: Record<DiscrepancyType, SchemaDiscrepancy[]>;
} {
  const result = {
    critical: [] as SchemaDiscrepancy[],
    warning: [] as SchemaDiscrepancy[],
    info: [] as SchemaDiscrepancy[],
    byType: {} as Record<DiscrepancyType, SchemaDiscrepancy[]>,
  };

  for (const discrepancy of discrepancies) {
    // By severity
    switch (discrepancy.severity) {
      case 'critical':
        result.critical.push(discrepancy);
        break;
      case 'warning':
        result.warning.push(discrepancy);
        break;
      case 'info':
        result.info.push(discrepancy);
        break;
    }

    // By type
    const dtype = discrepancy.type;
    if (!result.byType[dtype]) {
      result.byType[dtype] = [];
    }
    result.byType[dtype]?.push(discrepancy);
  }

  return result;
}

/**
 * Remove duplicate discrepancies
 * @param discrepancies Array of discrepancies
 * @returns Deduplicated array
 */
export function dedupDiscrepancies(discrepancies: SchemaDiscrepancy[]): SchemaDiscrepancy[] {
  const seen = new Set<string>();
  const deduped: SchemaDiscrepancy[] = [];

  for (const discrepancy of discrepancies) {
    const key = `${discrepancy.datasetId}-${discrepancy.type}-${discrepancy.columnName || 'table'}-${discrepancy.message}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(discrepancy);
    }
  }

  return deduped;
}

/**
 * Normalize introspected columns for comparison
 */
function normalizeIntrospectedColumns(columns: Column[]): NormalizedColumn[] {
  return columns.map((col) => ({
    name: col.name.toLowerCase().trim(),
    type: normalizeDataType(col.dataType),
    source: 'database' as const,
    originalName: col.name,
  }));
}

/**
 * Normalize YML columns for comparison
 */
function normalizeYmlColumns(columns: YmlColumnInfo[]): NormalizedColumn[] {
  return columns.map((col) => ({
    name: col.name.toLowerCase().trim(),
    type: normalizeDataType(col.type),
    source: 'yml' as const,
    originalName: col.name,
  }));
}

/**
 * Normalize data types for comparison
 * Maps various type representations to common forms
 */
function normalizeDataType(type: string | undefined): string {
  if (!type) return 'unknown';
  const normalized = type.toLowerCase().trim();

  // Map common type variations
  const typeMap: Record<string, string> = {
    varchar: 'string',
    text: 'string',
    char: 'string',
    nvarchar: 'string',
    nchar: 'string',
    int: 'number',
    integer: 'number',
    bigint: 'number',
    smallint: 'number',
    tinyint: 'number',
    decimal: 'number',
    numeric: 'number',
    float: 'number',
    double: 'number',
    real: 'number',
    money: 'number',
    boolean: 'boolean',
    bool: 'boolean',
    bit: 'boolean',
    date: 'date',
    datetime: 'timestamp',
    datetime2: 'timestamp',
    timestamp: 'timestamp',
    timestamptz: 'timestamp',
    time: 'time',
    json: 'json',
    jsonb: 'json',
  };

  // Extract base type (remove size specifiers)
  const baseType = normalized.split('(')[0] || normalized;

  return typeMap[baseType] || baseType;
}

/**
 * Check if two normalized types match
 * Allows for some flexibility in type matching
 */
function doTypesMatch(dbType: string, ymlType: string): boolean {
  // Exact match
  if (dbType === ymlType) {
    return true;
  }

  // Allow number types to match
  const numberTypes = [
    'number',
    'int',
    'integer',
    'bigint',
    'decimal',
    'numeric',
    'float',
    'double',
  ];
  if (numberTypes.includes(dbType) && numberTypes.includes(ymlType)) {
    return true;
  }

  // Allow string types to match
  const stringTypes = ['string', 'varchar', 'text', 'char'];
  if (stringTypes.includes(dbType) && stringTypes.includes(ymlType)) {
    return true;
  }

  // Allow timestamp types to match
  const timestampTypes = ['timestamp', 'datetime', 'timestamptz'];
  if (timestampTypes.includes(dbType) && timestampTypes.includes(ymlType)) {
    return true;
  }

  return false;
}
