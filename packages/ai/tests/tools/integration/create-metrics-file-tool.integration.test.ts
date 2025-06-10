import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { createMetrics } from '../../../src/tools/visualization-tools/create-metrics-file-tool';

describe('Create Metrics File Tool Integration Tests', () => {
  let mockRuntimeContext: any;
  let testDataSourceId: string;
  let testUserId: string;
  let testOrgId: string;

  beforeEach(() => {
    // Use real test environment IDs
    testDataSourceId = 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a';
    testUserId = '1fe85021-e799-471b-8837-953e9ae06e4c';
    testOrgId = 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce';

    mockRuntimeContext = {
      get: (key: string) => {
        const values: Record<string, string> = {
          dataSourceId: testDataSourceId,
          data_source_syntax: 'postgresql',
          user_id: testUserId,
          organization_id: testOrgId,
        };
        return values[key];
      },
    };
  });

  afterEach(async () => {
    // Clean up any test data - but only if the tests actually created records
    // For now, most tests will fail at database insertion due to FK constraints
    // which is expected in this test environment
  });

  test('should have correct tool configuration', () => {
    expect(createMetrics.id).toBe('create-metrics-file');
    expect(createMetrics.description).toContain('Creates metric configuration files');
    expect(createMetrics.inputSchema).toBeDefined();
    expect(createMetrics.outputSchema).toBeDefined();
    expect(createMetrics.execute).toBeDefined();
  });

  test('should validate tool input schema', () => {
    const validInput = {
      files: [
        {
          name: 'Integration Test Metric',
          yml_content: `
name: Integration Test Metric
description: A metric for integration testing
timeFrame: Last 30 days
sql: |
  SELECT 
    product_name,
    COUNT(*) as order_count
  FROM sales 
  WHERE order_date >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY product_name
chartConfig:
  selectedChartType: table
  columnLabelFormats:
    product_name:
      columnType: string
      style: string
      numberSeparatorStyle: null
      replaceMissingDataWith: null
    order_count:
      columnType: number
      style: number
      numberSeparatorStyle: ","
      replaceMissingDataWith: 0
          `,
        },
      ],
    };

    const result = createMetrics.inputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  test('should validate tool output schema', () => {
    const validOutput = {
      message: 'Successfully created 1 metric files.',
      duration: 1000,
      files: [
        {
          id: randomUUID(),
          name: 'Test Metric',
          file_type: 'metric',
          yml_content: 'name: Test',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          version_number: 1,
        },
      ],
      failed_files: [],
    };

    const result = createMetrics.outputSchema.safeParse(validOutput);
    expect(result.success).toBe(true);
  });

  test('should handle runtime context requirements', async () => {
    const contextWithoutDataSource = {
      get: (key: string) => {
        if (key === 'dataSourceId') return undefined;
        return 'test-value';
      },
    };

    const validYaml = `
name: Test
description: Test
timeFrame: Today
sql: SELECT * FROM test
chartConfig:
  selectedChartType: table
  columnLabelFormats:
    test:
      columnType: string
      style: string
      numberSeparatorStyle: null
      replaceMissingDataWith: null
    `;

    const input = {
      files: [{ name: 'Test', yml_content: validYaml }],
      runtimeContext: contextWithoutDataSource,
    };

    await expect(createMetrics.execute({ context: input })).rejects.toThrow(
      'Data source ID not found in runtime context'
    );
  });

  test('should reject invalid YAML in integration context', async () => {
    const invalidYaml = `
name: Invalid Metric
description: Invalid metric
# Missing timeFrame and sql
chartConfig:
  selectedChartType: table
  columnLabelFormats:
    test:
      columnType: string
      style: string
      numberSeparatorStyle: null
      replaceMissingDataWith: null
    `;

    const input = {
      files: [{ name: 'Invalid Metric', yml_content: invalidYaml }],
      runtimeContext: mockRuntimeContext,
    };

    const result = await createMetrics.execute({ context: input });

    expect(result.files).toHaveLength(0);
    expect(result.failed_files).toHaveLength(1);
    expect(result.failed_files[0].name).toBe('Invalid Metric');
    expect(result.failed_files[0].error).toContain('Invalid YAML structure');
  });

  test('should reject invalid SQL in integration context', async () => {
    const invalidSqlYaml = `
name: Invalid SQL
description: Test with invalid SQL
timeFrame: Today
sql: INSERT INTO test VALUES (1, 'invalid')
chartConfig:
  selectedChartType: table
  columnLabelFormats:
    test:
      columnType: string
      style: string
      numberSeparatorStyle: null
      replaceMissingDataWith: null
    `;

    const input = {
      files: [{ name: 'Invalid SQL', yml_content: invalidSqlYaml }],
      runtimeContext: mockRuntimeContext,
    };

    const result = await createMetrics.execute({ context: input });

    expect(result.files).toHaveLength(0);
    expect(result.failed_files).toHaveLength(1);
    expect(result.failed_files[0].name).toBe('Invalid SQL');
    expect(result.failed_files[0].error).toContain('SQL query must contain SELECT statement');
  });

  test('should handle mixed success and failure scenarios', async () => {
    const validYamlStructure = `
name: Valid Metric
description: This has valid YAML structure
timeFrame: Today
sql: SELECT COUNT(*) as count FROM valid_table
chartConfig:
  selectedChartType: table
  columnLabelFormats:
    count:
      columnType: number
      style: number
      numberSeparatorStyle: null
      replaceMissingDataWith: 0
    `;

    const invalidYaml = `
name: Invalid Metric
description: This should fail YAML validation
timeFrame: Today
sql: # Empty SQL should fail validation
chartConfig:
  selectedChartType: table
  columnLabelFormats:
    test:
      columnType: string
      style: string
      numberSeparatorStyle: null
      replaceMissingDataWith: null
    `;

    const input = {
      files: [
        { name: 'Valid YAML Structure', yml_content: validYamlStructure },
        { name: 'Invalid Metric', yml_content: invalidYaml },
      ],
      runtimeContext: mockRuntimeContext,
    };

    const result = await createMetrics.execute({ context: input });

    // Should have one success and one failure
    expect(result.files).toHaveLength(1);
    expect(result.failed_files).toHaveLength(1);

    // The success should be the valid YAML structure (name comes from YAML content)
    expect(result.files[0].name).toBe('Valid Metric');

    // The failure should be due to YAML validation (empty sql)
    const yamlFailure = result.failed_files.find((f) => f.name === 'Invalid Metric');
    expect(yamlFailure?.error).toContain('Invalid YAML structure');
  });

  test('should properly format response timing', async () => {
    const validYaml = `
name: Timing Test
description: Test response timing
timeFrame: Today
sql: SELECT * FROM timing_test
chartConfig:
  selectedChartType: table
  columnLabelFormats:
    test:
      columnType: string
      style: string
      numberSeparatorStyle: null
      replaceMissingDataWith: null
    `;

    const input = {
      files: [{ name: 'Timing Test', yml_content: validYaml }],
      runtimeContext: mockRuntimeContext,
    };

    const result = await createMetrics.execute({ context: input });

    expect(result.duration).toBeGreaterThan(0);
    expect(typeof result.duration).toBe('number');
    expect(result.duration).toBeLessThan(10000); // Should complete within 10 seconds
  });

  test('should handle bulk operations correctly', async () => {
    const createMetricYaml = (index: number) => `
name: Bulk Metric ${index}
description: Metric ${index} for bulk testing
timeFrame: Last ${index} days
sql: SELECT COUNT(*) as count_${index} FROM table_${index}
chartConfig:
  selectedChartType: table
  columnLabelFormats:
    count_${index}:
      columnType: number
      style: number
      numberSeparatorStyle: null
      replaceMissingDataWith: 0
    `;

    const files = Array.from({ length: 3 }, (_, i) => ({
      name: `Bulk Metric ${i + 1}`,
      yml_content: createMetricYaml(i + 1),
    }));

    const input = {
      files,
      runtimeContext: mockRuntimeContext,
    };

    const result = await createMetrics.execute({ context: input });

    expect(result.files).toHaveLength(3);
    expect(result.failed_files).toHaveLength(0);
    expect(result.message).toBe('Successfully created 3 metric files.');

    // Verify all files have proper structure
    result.files.forEach((file, index) => {
      expect(file.file_type).toBe('metric');
      expect(file.version_number).toBe(1);
      expect(file.name).toContain('Bulk Metric');
      expect(file.yml_content).toContain(`Bulk Metric ${index + 1}`);
    });
  });

  test('should generate appropriate success and error messages', async () => {
    // Test success message
    const validYaml = `
name: Success Message Test
description: Test success message generation
timeFrame: Today
sql: SELECT * FROM success_test
chartConfig:
  selectedChartType: table
  columnLabelFormats:
    test:
      columnType: string
      style: string
      numberSeparatorStyle: null
      replaceMissingDataWith: null
    `;

    const successInput = {
      files: [{ name: 'Success Message Test', yml_content: validYaml }],
      runtimeContext: mockRuntimeContext,
    };

    const successResult = await createMetrics.execute({ context: successInput });
    expect(successResult.message).toBe('Successfully created 1 metric files.');

    // Test failure message
    const invalidYaml = 'invalid yaml structure';

    const failureInput = {
      files: [{ name: 'Failure Test', yml_content: invalidYaml }],
      runtimeContext: mockRuntimeContext,
    };

    const failureResult = await createMetrics.execute({ context: failureInput });
    expect(failureResult.message).toContain("Failed to create 'Failure Test'");
    expect(failureResult.message).toContain('Please recreate the metric from scratch');
  });
});
