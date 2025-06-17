// import { randomUUID } from 'node:crypto';
// import { db, eq, metricFiles } from '@buster/database';
// import { afterEach, beforeEach, describe, expect, test } from 'vitest';
// import { createMetricsFileTool } from '../../../src/tools/visualization-tools/create-metrics-file-tool';
// import { modifyMetricsFileTool } from '../../../src/tools/visualization-tools/modify-metrics-file-tool';

/*
describe('Modify Metrics File Tool Integration Tests', () => {
  let mockRuntimeContext: { get: (key: string) => string; set: (key: string, value: string) => void };
  let testDataSourceId: string;
  let testUserId: string;
  let testOrgId: string;
  let createdMetricIds: string[] = [];

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

    // Reset created metrics array
    createdMetricIds = [];
  });

  afterEach(async () => {
    // Clean up created metrics
    if (createdMetricIds.length > 0) {
      try {
        await db.delete(metricFiles).where(eq(metricFiles.id, createdMetricIds[0])).execute();
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  // Helper function to create a test metric first
  async function createTestMetric(name = 'Test Metric for Update'): Promise<string> {
    const createYaml = `
name: ${name}
description: A metric created for testing updates
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
    `;

    const createInput = {
      files: [{ name, yml_content: createYaml }],
      runtimeContext: mockRuntimeContext,
    };

    const createResult = await createMetricsFileTool.execute({ context: createInput });

    if (createResult.files.length > 0) {
      const metricId = createResult.files[0].id;
      createdMetricIds.push(metricId);
      return metricId;
    }

    throw new Error('Failed to create test metric');
  }

  test('should have correct tool configuration', () => {
    expect(modifyMetricsFileTool.id).toBe('modify-metrics-file');
    expect(modifyMetricsFileTool.description).toContain(
      'Updates existing metric configuration files'
    );
    expect(modifyMetricsFileTool.inputSchema).toBeDefined();
    expect(modifyMetricsFileTool.outputSchema).toBeDefined();
    expect(modifyMetricsFileTool.execute).toBeDefined();
  });

  test('should validate tool input schema for updates', () => {
    const validInput = {
      files: [
        {
          id: randomUUID(),
          yml_content: `
name: Updated Test Metric
description: An updated metric for testing
timeFrame: Last 60 days
sql: |
  SELECT 
    product_name,
    COUNT(*) as order_count,
    SUM(amount) as total_revenue
  FROM sales 
  WHERE order_date >= CURRENT_DATE - INTERVAL '60 days'
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
    total_revenue:
      columnType: number
      style: currency
      currency: "USD"
      numberSeparatorStyle: ","
      replaceMissingDataWith: 0
          `,
        },
      ],
    };

    const result = modifyMetricsFileTool.inputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  test('should validate tool output schema', () => {
    const validOutput = {
      message: 'Successfully modified 1 metric files.',
      duration: 1000,
      files: [
        {
          id: randomUUID(),
          name: 'Updated Test Metric',
          file_type: 'metric',
          yml_content: 'name: Updated Test',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          version_number: 2,
        },
      ],
      failed_files: [],
    };

    const result = modifyMetricsFileTool.outputSchema.safeParse(validOutput);
    expect(result.success).toBe(true);
  });

  test('should handle runtime context requirements for updates', async () => {
    const contextWithoutDataSource = {
      get: (key: string) => {
        if (key === 'dataSourceId') return undefined;
        return 'test-value';
      },
    };

    const validYaml = `
name: Update Test
description: Update test
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
      files: [{ id: randomUUID(), yml_content: validYaml }],
      runtimeContext: contextWithoutDataSource,
    };

    await expect(modifyMetricsFileTool.execute({ context: input })).rejects.toThrow(
      'Data source ID not found in runtime context'
    );
  });

  test('should reject updates with invalid YAML in integration context', async () => {
    // First create a metric to update
    const metricId = await createTestMetric('Metric for Invalid YAML Update');

    const invalidYaml = `
name: Invalid Updated Metric
description: Invalid updated metric
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
      files: [{ id: metricId, yml_content: invalidYaml }],
      runtimeContext: mockRuntimeContext,
    };

    const result = await modifyMetricsFileTool.execute({ context: input });

    expect(result.files).toHaveLength(0);
    expect(result.failed_files).toHaveLength(1);
    expect(result.failed_files[0].file_name).toBe('Metric for Invalid YAML Update');
    expect(result.failed_files[0].error).toContain('Invalid YAML structure');
  });

  test('should reject updates with invalid SQL in integration context', async () => {
    // First create a metric to update
    const metricId = await createTestMetric('Metric for Invalid SQL Update');

    const invalidSqlYaml = `
name: Invalid SQL Update
description: Test with invalid SQL update
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
      files: [{ id: metricId, yml_content: invalidSqlYaml }],
      runtimeContext: mockRuntimeContext,
    };

    const result = await modifyMetricsFileTool.execute({ context: input });

    expect(result.files).toHaveLength(0);
    expect(result.failed_files).toHaveLength(1);
    expect(result.failed_files[0].file_name).toBe('Metric for Invalid SQL Update');
    expect(result.failed_files[0].error).toContain('SQL query must contain SELECT statement');
  });

  test('should successfully update a metric with valid YAML', async () => {
    // First create a metric to update
    const metricId = await createTestMetric('Metric for Valid Update');

    const updatedYaml = `
name: Successfully Updated Metric
description: This metric has been successfully updated
timeFrame: Last 90 days
sql: |
  SELECT 
    product_category,
    COUNT(*) as order_count,
    SUM(amount) as total_revenue,
    AVG(amount) as avg_order_value
  FROM sales 
  WHERE order_date >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY product_category
  ORDER BY total_revenue DESC
chartConfig:
  selectedChartType: table
  columnLabelFormats:
    product_category:
      columnType: string
      style: string
      numberSeparatorStyle: null
      replaceMissingDataWith: null
    order_count:
      columnType: number
      style: number
      numberSeparatorStyle: ","
      replaceMissingDataWith: 0
    total_revenue:
      columnType: number
      style: currency
      currency: "USD"
      numberSeparatorStyle: ","
      replaceMissingDataWith: 0
    avg_order_value:
      columnType: number
      style: currency
      currency: "USD"
      numberSeparatorStyle: ","
      replaceMissingDataWith: 0
      minimumFractionDigits: 2
    `;

    const input = {
      files: [{ id: metricId, yml_content: updatedYaml }],
      runtimeContext: mockRuntimeContext,
    };

    const result = await modifyMetricsFileTool.execute({ context: input });

    expect(result.files).toHaveLength(1);
    expect(result.failed_files).toHaveLength(0);
    expect(result.files[0].name).toBe('Successfully Updated Metric');
    expect(result.files[0].version_number).toBeGreaterThan(1);
    expect(result.message).toBe('Successfully modified 1 metric file.');
  });

  test('should handle mixed success and failure scenarios in updates', async () => {
    // Create two metrics to update
    const validMetricId = await createTestMetric('Valid Update Target');
    const invalidMetricId = await createTestMetric('Invalid Update Target');

    const validUpdatedYaml = `
name: Valid Updated Metric
description: This update should succeed
timeFrame: Last 7 days
sql: SELECT COUNT(*) as count FROM valid_table WHERE date >= CURRENT_DATE - INTERVAL '7 days'
chartConfig:
  selectedChartType: table
  columnLabelFormats:
    count:
      columnType: number
      style: number
      numberSeparatorStyle: null
      replaceMissingDataWith: 0
    `;

    const invalidUpdatedYaml = `
name: Invalid Updated Metric
description: This update should fail
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
        { id: validMetricId, yml_content: validUpdatedYaml },
        { id: invalidMetricId, yml_content: invalidUpdatedYaml },
      ],
      runtimeContext: mockRuntimeContext,
    };

    const result = await modifyMetricsFileTool.execute({ context: input });

    // Should have one success and one failure
    expect(result.files).toHaveLength(1);
    expect(result.failed_files).toHaveLength(1);

    // The success should be the valid update
    expect(result.files[0].name).toBe('Valid Updated Metric');

    // The failure should be due to YAML validation (empty sql)
    const yamlFailure = result.failed_files.find((f) => f.file_name === 'Invalid Update Target');
    expect(yamlFailure?.error).toContain('Invalid YAML structure');
  });

  test('should properly format response timing for updates', async () => {
    // Create a metric to update
    const metricId = await createTestMetric('Timing Test Update');

    const validYaml = `
name: Timing Test Updated
description: Test response timing for updates
timeFrame: Today
sql: SELECT * FROM timing_test_updated
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
      files: [{ id: metricId, yml_content: validYaml }],
      runtimeContext: mockRuntimeContext,
    };

    const result = await modifyMetricsFileTool.execute({ context: input });

    expect(result.duration).toBeGreaterThan(0);
    expect(typeof result.duration).toBe('number');
    expect(result.duration).toBeLessThan(10000); // Should complete within 10 seconds
  });

  test('should handle bulk update operations correctly', async () => {
    // Create multiple metrics to update
    const metricIds = await Promise.all([
      createTestMetric('Bulk Update Metric 1'),
      createTestMetric('Bulk Update Metric 2'),
      createTestMetric('Bulk Update Metric 3'),
    ]);

    const createUpdatedYaml = (index: number) => `
name: Bulk Updated Metric ${index}
description: Metric ${index} updated for bulk testing
timeFrame: Last ${index * 10} days
sql: SELECT COUNT(*) as count_${index} FROM table_${index} WHERE date >= CURRENT_DATE - INTERVAL '${index * 10} days'
chartConfig:
  selectedChartType: table
  columnLabelFormats:
    count_${index}:
      columnType: number
      style: number
      numberSeparatorStyle: null
      replaceMissingDataWith: 0
    `;

    const files = metricIds.map((id, i) => ({
      id,
      yml_content: createUpdatedYaml(i + 1),
    }));

    const input = {
      files,
      runtimeContext: mockRuntimeContext,
    };

    const result = await modifyMetricsFileTool.execute({ context: input });

    expect(result.files).toHaveLength(3);
    expect(result.failed_files).toHaveLength(0);
    expect(result.message).toBe('Successfully modified 3 metric files.');

    // Verify all files have proper structure and updated content
    result.files.forEach((file) => {
      expect(file.file_type).toBe('metric');
      expect(file.version_number).toBeGreaterThan(1);
      expect(file.name).toContain('Bulk Updated Metric');
      expect(file.yml_content).toContain('Bulk Updated Metric');
    });
  });

  test('should generate appropriate success and error messages for updates', async () => {
    // Test success message
    const successMetricId = await createTestMetric('Success Message Update Test');

    const validYaml = `
name: Success Message Updated Test
description: Test success message generation for updates
timeFrame: Today
sql: SELECT * FROM success_test_updated
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
      files: [{ id: successMetricId, yml_content: validYaml }],
      runtimeContext: mockRuntimeContext,
    };

    const successResult = await modifyMetricsFileTool.execute({ context: successInput });
    expect(successResult.message).toBe('Successfully modified 1 metric file.');

    // Test failure message
    const failureMetricId = await createTestMetric('Failure Update Test');
    const invalidYaml = 'invalid yaml structure for update';

    const failureInput = {
      files: [{ id: failureMetricId, yml_content: invalidYaml }],
      runtimeContext: mockRuntimeContext,
    };

    const failureResult = await modifyMetricsFileTool.execute({ context: failureInput });
    expect(failureResult.message).toBe('Failed to modify 1 metric file.');
    expect(failureResult.failed_files).toHaveLength(1);
    expect(failureResult.failed_files[0].error).toContain(
      'Please attempt to modify the metric again'
    );
  });

  test('should handle non-existent metric ID gracefully', async () => {
    const nonExistentId = randomUUID();

    const validYaml = `
name: Non-existent Update
description: Trying to update a non-existent metric
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
      files: [{ id: nonExistentId, yml_content: validYaml }],
      runtimeContext: mockRuntimeContext,
    };

    const result = await modifyMetricsFileTool.execute({ context: input });

    expect(result.files).toHaveLength(0);
    expect(result.message).toBe('No metric files found with the provided IDs');
  });

  test('should validate version increment logic', async () => {
    // Create a metric and update it multiple times to test version increments
    const metricId = await createTestMetric('Version Test Metric');

    // First update
    const firstUpdateYaml = `
name: Version Test Updated v1
description: First update
timeFrame: Today
sql: SELECT * FROM test_v1
chartConfig:
  selectedChartType: table
  columnLabelFormats:
    test:
      columnType: string
      style: string
      numberSeparatorStyle: null
      replaceMissingDataWith: null
    `;

    const firstInput = {
      files: [{ id: metricId, yml_content: firstUpdateYaml }],
      runtimeContext: mockRuntimeContext,
    };

    const firstResult = await modifyMetricsFileTool.execute({ context: firstInput });
    expect(firstResult.files).toHaveLength(1);
    const firstVersion = firstResult.files[0].version_number;
    expect(firstVersion).toBeGreaterThan(1);

    // Second update
    const secondUpdateYaml = `
name: Version Test Updated v2
description: Second update
timeFrame: Last 7 days
sql: SELECT * FROM test_v2 WHERE date >= CURRENT_DATE - INTERVAL '7 days'
chartConfig:
  selectedChartType: table
  columnLabelFormats:
    test:
      columnType: string
      style: string
      numberSeparatorStyle: null
      replaceMissingDataWith: null
    `;

    const secondInput = {
      files: [{ id: metricId, yml_content: secondUpdateYaml }],
      runtimeContext: mockRuntimeContext,
    };

    const secondResult = await modifyMetricsFileTool.execute({ context: secondInput });
    expect(secondResult.files).toHaveLength(1);
    const secondVersion = secondResult.files[0].version_number;
    expect(secondVersion).toBeGreaterThan(firstVersion);
  });
});
*/
