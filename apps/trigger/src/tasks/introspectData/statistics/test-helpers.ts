import type { ColumnSchema, TableSample } from '@buster/data-source';

/**
 * Infer column schema from sample data for testing
 * This mimics what the data source would provide in production
 */
function inferColumnSchemas(sampleData: Record<string, unknown>[]): ColumnSchema[] {
  if (sampleData.length === 0) return [];

  const firstRow = sampleData[0];
  if (!firstRow) return [];

  const columns = Object.keys(firstRow);
  const schemas: ColumnSchema[] = [];

  for (const col of columns) {
    // Sample all rows to determine the most appropriate type
    const values = sampleData.map((row) => row[col]).filter((v) => v !== null && v !== undefined);

    // Determine the SQL type based on the values
    let type = 'VARCHAR';
    const hasNull = sampleData.some((row) => row[col] === null || row[col] === undefined);

    if (values.length > 0) {
      // Check what types we have
      const types = new Set<string>();
      let allNumeric = true;
      let hasFloat = false;

      for (const value of values) {
        if (typeof value === 'number') {
          types.add('number');
          if (!Number.isInteger(value)) {
            hasFloat = true;
          }
        } else if (typeof value === 'boolean') {
          types.add('boolean');
          allNumeric = false;
        } else if (value instanceof Date) {
          types.add('date');
          allNumeric = false;
        } else if (typeof value === 'string') {
          // Check if it's a numeric string
          const trimmed = value.trim();
          if (trimmed && !Number.isNaN(Number(trimmed))) {
            // Could be numeric, but we have a string
            types.add('numeric_string');
            if (!Number.isInteger(Number(trimmed))) {
              hasFloat = true;
            }
          } else {
            types.add('string');
            allNumeric = false;
          }
        } else {
          types.add('object');
          allNumeric = false;
        }
      }

      // Determine SQL type
      if (types.has('string') || types.has('object')) {
        type = 'VARCHAR';
      } else if (types.size > 1 && !types.has('numeric_string')) {
        // Mixed non-compatible types
        type = 'VARCHAR';
      } else if (types.has('boolean') && types.size === 1) {
        type = 'BOOLEAN';
      } else if (types.has('date') && types.size === 1) {
        type = 'TIMESTAMP';
      } else if (types.has('number') && types.size === 1) {
        type = hasFloat ? 'DOUBLE' : 'BIGINT';
      } else if (types.has('numeric_string') && allNumeric) {
        // All values are numeric strings
        type = hasFloat ? 'DOUBLE' : 'BIGINT';
      } else {
        type = 'VARCHAR';
      }
    }

    schemas.push({
      name: col,
      type,
      nullable: hasNull,
      length: type === 'VARCHAR' ? 65535 : undefined,
    });
  }

  return schemas;
}

/**
 * Helper function to create a valid TableSample object for testing
 */
export function createTestTableSample(
  sampleData: Record<string, unknown>[],
  overrides?: Partial<TableSample>
): TableSample {
  // Generate column schemas from the data if not provided
  const columnSchemas = overrides?.columnSchemas || inferColumnSchemas(sampleData);

  return {
    tableId: 'test.public.test_table',
    rowCount: 1000, // Default row count for testing
    sampleSize: sampleData.length,
    sampleData,
    sampledAt: new Date('2024-01-01T00:00:00Z'),
    samplingMethod: 'RANDOM',
    columnSchemas, // Now always includes schemas
    ...overrides,
  };
}
