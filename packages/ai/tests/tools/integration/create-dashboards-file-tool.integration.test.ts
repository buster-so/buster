import { randomUUID } from 'node:crypto';
import {
  dashboardFiles,
  db,
  eq,
  inArray,
  metricFiles,
  metricFilesToDashboardFiles,
} from '@buster/database';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { createDashboardsFileTool } from '../../../src/tools/visualization-tools/create-dashboards-file-tool';

describe('Create Dashboards File Tool Integration Tests', () => {
  let mockRuntimeContext: any;
  let testDataSourceId: string;
  let testUserId: string;
  let testOrgId: string;
  let createdMetricIds: string[] = [];
  let createdDashboardIds: string[] = [];

  beforeEach(() => {
    // Use real test environment IDs
    testDataSourceId = 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a';
    testUserId = '1fe85021-e799-471b-8837-953e9ae06e4c';
    testOrgId = 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce';

    mockRuntimeContext = {
      get: (key: string) => {
        const values: Record<string, string> = {
          user_id: testUserId,
          organization_id: testOrgId,
        };
        return values[key];
      },
    };

    // Reset created IDs arrays
    createdMetricIds = [];
    createdDashboardIds = [];
  });

  afterEach(async () => {
    // Clean up created dashboards and metrics
    try {
      if (createdDashboardIds.length > 0) {
        await db
          .delete(dashboardFiles)
          .where(inArray(dashboardFiles.id, createdDashboardIds))
          .execute();
      }

      if (createdMetricIds.length > 0) {
        await db.delete(metricFiles).where(inArray(metricFiles.id, createdMetricIds)).execute();
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  // Helper function to create test metrics for dashboard testing
  async function createTestMetrics(count = 1): Promise<string[]> {
    const metricIds: string[] = [];

    for (let i = 1; i <= count; i++) {
      const metricId = randomUUID();
      const metricYml = {
        name: `Test Metric ${i}`,
        description: `A test metric ${i} for dashboard testing`,
        timeFrame: 'Last 30 days',
        sql: `SELECT COUNT(*) as count_${i} FROM test_table_${i}`,
        chartConfig: {
          selectedChartType: 'table',
          columnLabelFormats: {
            [`count_${i}`]: {
              columnType: 'number',
              style: 'number',
              numberSeparatorStyle: ',',
              replaceMissingDataWith: 0,
            },
          },
        },
      };

      await db
        .insert(metricFiles)
        .values({
          id: metricId,
          name: `Test Metric ${i}`,
          fileName: `test-metric-${i}`,
          content: metricYml,
          verification: 'notRequested',
          organizationId: testOrgId,
          createdBy: testUserId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          versionHistory: {
            versions: [
              {
                versionNumber: 1,
                content: metricYml,
                createdAt: new Date().toISOString(),
              },
            ],
          },
          dataSourceId: testDataSourceId,
        })
        .execute();

      metricIds.push(metricId);
      createdMetricIds.push(metricId);
    }

    return metricIds;
  }

  test('should have correct tool configuration', () => {
    expect(createDashboardsFileTool.id).toBe('create-dashboards-file');
    expect(createDashboardsFileTool.description).toContain('Creates new dashboard files');
    expect(createDashboardsFileTool.inputSchema).toBeDefined();
    expect(createDashboardsFileTool.outputSchema).toBeDefined();
    expect(createDashboardsFileTool.execute).toBeDefined();
  });

  test('should validate tool input schema', () => {
    const validInput = {
      files: [
        {
          name: 'Test Dashboard',
          yml_content: `
name: Sales Dashboard
description: A comprehensive view of sales metrics
rows:
  - id: 1
    items:
      - id: f47ac10b-58cc-4372-a567-0e02b2c3d479
    columnSizes:
      - 12
          `,
        },
      ],
    };

    const result = createDashboardsFileTool.inputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  test('should validate tool output schema', () => {
    const validOutput = {
      message: 'Successfully created 1 dashboard file.',
      duration: 1000,
      files: [
        {
          id: randomUUID(),
          name: 'Test Dashboard',
          file_type: 'dashboard',
          yml_content: 'name: Test Dashboard',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          version_number: 1,
        },
      ],
      failed_files: [],
    };

    const result = createDashboardsFileTool.outputSchema.safeParse(validOutput);
    expect(result.success).toBe(true);
  });

  test('should handle runtime context requirements', async () => {
    const contextWithoutUserId = {
      get: (key: string) => {
        if (key === 'user_id') return undefined;
        return 'test-value';
      },
    };

    const validYaml = `
name: Test Dashboard
description: Test dashboard
rows:
  - id: 1
    items:
      - id: f47ac10b-58cc-4372-a567-0e02b2c3d479
    columnSizes:
      - 12
    `;

    const input = {
      files: [{ name: 'Test Dashboard', yml_content: validYaml }],
      runtimeContext: contextWithoutUserId,
    };

    await expect(createDashboardsFileTool.execute({ context: input })).rejects.toThrow(
      'User ID not found in runtime context'
    );
  });

  test('should reject dashboard with invalid YAML in integration context', async () => {
    const invalidYaml = `
name: Invalid Dashboard
description: Invalid dashboard
# Missing rows
    `;

    const input = {
      files: [{ name: 'Invalid Dashboard', yml_content: invalidYaml }],
      runtimeContext: mockRuntimeContext,
    };

    const result = await createDashboardsFileTool.execute({ context: input });

    expect(result.files).toHaveLength(0);
    expect(result.failed_files).toHaveLength(1);
    expect(result.failed_files[0].name).toBe('Invalid Dashboard');
    expect(result.failed_files[0].error).toContain('Invalid YAML format');
  });

  test('should reject dashboard with invalid column sizes', async () => {
    const invalidColumnSizesYaml = `
name: Invalid Column Dashboard
description: Dashboard with invalid column sizes
rows:
  - id: 1
    items:
      - id: f47ac10b-58cc-4372-a567-0e02b2c3d479
    columnSizes:
      - 10
    `;

    const input = {
      files: [{ name: 'Invalid Column Dashboard', yml_content: invalidColumnSizesYaml }],
      runtimeContext: mockRuntimeContext,
    };

    const result = await createDashboardsFileTool.execute({ context: input });

    expect(result.files).toHaveLength(0);
    expect(result.failed_files).toHaveLength(1);
    expect(result.failed_files[0].error).toContain('Column sizes must sum to exactly 12');
  });

  test('should reject dashboard with non-existent metric IDs', async () => {
    const nonExistentMetricYaml = `
name: Non-existent Metric Dashboard
description: Dashboard referencing non-existent metrics
rows:
  - id: 1
    items:
      - id: 00000000-0000-0000-0000-000000000000
    columnSizes:
      - 12
    `;

    const input = {
      files: [{ name: 'Non-existent Metric Dashboard', yml_content: nonExistentMetricYaml }],
      runtimeContext: mockRuntimeContext,
    };

    const result = await createDashboardsFileTool.execute({ context: input });

    expect(result.files).toHaveLength(0);
    expect(result.failed_files).toHaveLength(1);
    expect(result.failed_files[0].error).toContain('Invalid metric references');
  });

  test('should successfully create dashboard with valid metrics', async () => {
    // Create test metrics first
    const metricIds = await createTestMetrics(2);

    const validDashboardYaml = `
name: Valid Dashboard
description: A valid dashboard with existing metrics
rows:
  - id: 1
    items:
      - id: ${metricIds[0]}
      - id: ${metricIds[1]}
    columnSizes:
      - 6
      - 6
    `;

    const input = {
      files: [{ name: 'Valid Dashboard', yml_content: validDashboardYaml }],
      runtimeContext: mockRuntimeContext,
    };

    const result = await createDashboardsFileTool.execute({ context: input });

    expect(result.files).toHaveLength(1);
    expect(result.failed_files).toHaveLength(0);
    expect(result.files[0].name).toBe('Valid Dashboard');
    expect(result.files[0].file_type).toBe('dashboard');
    expect(result.files[0].version_number).toBe(1);
    expect(result.message).toBe('Successfully created 1 dashboard file.');

    // Track created dashboard for cleanup
    createdDashboardIds.push(result.files[0].id);

    // Verify metric-dashboard associations were created
    const associations = await db
      .select()
      .from(metricFilesToDashboardFiles)
      .where(eq(metricFilesToDashboardFiles.dashboardFileId, result.files[0].id))
      .execute();

    expect(associations).toHaveLength(2);
    expect(associations.map((a) => a.metricFileId).sort()).toEqual(metricIds.sort());
  });

  test('should handle mixed success and failure scenarios', async () => {
    // Create test metrics
    const metricIds = await createTestMetrics(1);

    const validDashboardYaml = `
name: Valid Dashboard
description: This should succeed
rows:
  - id: 1
    items:
      - id: ${metricIds[0]}
    columnSizes:
      - 12
    `;

    const invalidDashboardYaml = `
name: Invalid Dashboard
description: This should fail
rows:
  - id: 1
    items:
      - id: 00000000-0000-0000-0000-000000000000
    columnSizes:
      - 12
    `;

    const input = {
      files: [
        { name: 'Valid Dashboard', yml_content: validDashboardYaml },
        { name: 'Invalid Dashboard', yml_content: invalidDashboardYaml },
      ],
      runtimeContext: mockRuntimeContext,
    };

    const result = await createDashboardsFileTool.execute({ context: input });

    expect(result.files).toHaveLength(1);
    expect(result.failed_files).toHaveLength(1);

    // The success should be the valid dashboard
    expect(result.files[0].name).toBe('Valid Dashboard');

    // The failure should be due to invalid metric reference
    const failure = result.failed_files.find((f) => f.name === 'Invalid Dashboard');
    expect(failure?.error).toContain('Invalid metric references');

    // Track created dashboard for cleanup
    createdDashboardIds.push(result.files[0].id);
  });

  test('should properly format response timing', async () => {
    // Create test metric
    const metricIds = await createTestMetrics(1);

    const validYaml = `
name: Timing Test Dashboard
description: Test response timing
rows:
  - id: 1
    items:
      - id: ${metricIds[0]}
    columnSizes:
      - 12
    `;

    const input = {
      files: [{ name: 'Timing Test Dashboard', yml_content: validYaml }],
      runtimeContext: mockRuntimeContext,
    };

    const result = await createDashboardsFileTool.execute({ context: input });

    expect(result.duration).toBeGreaterThan(0);
    expect(typeof result.duration).toBe('number');
    expect(result.duration).toBeLessThan(10000); // Should complete within 10 seconds

    // Track created dashboard for cleanup
    if (result.files.length > 0) {
      createdDashboardIds.push(result.files[0].id);
    }
  });

  test('should handle bulk dashboard operations correctly', async () => {
    // Create test metrics
    const metricIds = await createTestMetrics(4);

    const createDashboardYaml = (index: number) => `
name: Bulk Dashboard ${index}
description: Dashboard ${index} for bulk testing
rows:
  - id: 1
    items:
      - id: ${metricIds[index - 1]}
    columnSizes:
      - 12
    `;

    const files = Array.from({ length: 3 }, (_, i) => ({
      name: `Bulk Dashboard ${i + 1}`,
      yml_content: createDashboardYaml(i + 1),
    }));

    const input = {
      files,
      runtimeContext: mockRuntimeContext,
    };

    const result = await createDashboardsFileTool.execute({ context: input });

    expect(result.files).toHaveLength(3);
    expect(result.failed_files).toHaveLength(0);
    expect(result.message).toBe('Successfully created 3 dashboard files.');

    // Verify all files have proper structure
    result.files.forEach((file, index) => {
      expect(file.file_type).toBe('dashboard');
      expect(file.version_number).toBe(1);
      expect(file.name).toContain('Bulk Dashboard');
      expect(file.yml_content).toContain(`Bulk Dashboard ${index + 1}`);
    });

    // Track created dashboards for cleanup
    createdDashboardIds.push(...result.files.map((f) => f.id));
  });

  test('should handle complex dashboard with multiple rows', async () => {
    // Create test metrics
    const metricIds = await createTestMetrics(4);

    const complexDashboardYaml = `
name: Complex Dashboard
description: Dashboard with multiple rows and different layouts
rows:
  - id: 1
    items:
      - id: ${metricIds[0]}
    columnSizes:
      - 12
  - id: 2
    items:
      - id: ${metricIds[1]}
      - id: ${metricIds[2]}
    columnSizes:
      - 6
      - 6
  - id: 3
    items:
      - id: ${metricIds[3]}
    columnSizes:
      - 12
    `;

    const input = {
      files: [{ name: 'Complex Dashboard', yml_content: complexDashboardYaml }],
      runtimeContext: mockRuntimeContext,
    };

    const result = await createDashboardsFileTool.execute({ context: input });

    expect(result.files).toHaveLength(1);
    expect(result.failed_files).toHaveLength(0);
    expect(result.files[0].name).toBe('Complex Dashboard');

    // Track created dashboard for cleanup
    createdDashboardIds.push(result.files[0].id);

    // Verify all metric-dashboard associations were created
    const associations = await db
      .select()
      .from(metricFilesToDashboardFiles)
      .where(eq(metricFilesToDashboardFiles.dashboardFileId, result.files[0].id))
      .execute();

    expect(associations).toHaveLength(4);
    expect(associations.map((a) => a.metricFileId).sort()).toEqual(metricIds.sort());
  });

  test('should handle dashboard with maximum items per row', async () => {
    // Create test metrics
    const metricIds = await createTestMetrics(4);

    const maxItemsDashboardYaml = `
name: Max Items Dashboard
description: Dashboard with maximum 4 items per row
rows:
  - id: 1
    items:
      - id: ${metricIds[0]}
      - id: ${metricIds[1]}
      - id: ${metricIds[2]}
      - id: ${metricIds[3]}
    columnSizes:
      - 3
      - 3
      - 3
      - 3
    `;

    const input = {
      files: [{ name: 'Max Items Dashboard', yml_content: maxItemsDashboardYaml }],
      runtimeContext: mockRuntimeContext,
    };

    const result = await createDashboardsFileTool.execute({ context: input });

    expect(result.files).toHaveLength(1);
    expect(result.failed_files).toHaveLength(0);
    expect(result.files[0].name).toBe('Max Items Dashboard');

    // Track created dashboard for cleanup
    createdDashboardIds.push(result.files[0].id);

    // Verify dashboard content
    const dashboardFile = await db
      .select()
      .from(dashboardFiles)
      .where(eq(dashboardFiles.id, result.files[0].id))
      .execute();

    expect(dashboardFile).toHaveLength(1);
    expect(dashboardFile[0].content.rows[0].items).toHaveLength(4);
    expect(dashboardFile[0].content.rows[0].columnSizes).toEqual([3, 3, 3, 3]);
  });

  test('should generate appropriate success and error messages', async () => {
    // Test success message
    const metricIds = await createTestMetrics(1);

    const validYaml = `
name: Success Message Test
description: Test success message generation
rows:
  - id: 1
    items:
      - id: ${metricIds[0]}
    columnSizes:
      - 12
    `;

    const successInput = {
      files: [{ name: 'Success Message Test', yml_content: validYaml }],
      runtimeContext: mockRuntimeContext,
    };

    const successResult = await createDashboardsFileTool.execute({ context: successInput });
    expect(successResult.message).toBe('Successfully created 1 dashboard file.');

    // Track created dashboard for cleanup
    if (successResult.files.length > 0) {
      createdDashboardIds.push(successResult.files[0].id);
    }

    // Test failure message
    const invalidYaml = 'invalid yaml structure for dashboard';

    const failureInput = {
      files: [{ name: 'Failure Test', yml_content: invalidYaml }],
      runtimeContext: mockRuntimeContext,
    };

    const failureResult = await createDashboardsFileTool.execute({ context: failureInput });
    expect(failureResult.message).toContain("Failed to create 'Failure Test'");
  });

  test('should validate dashboard with different column size combinations', async () => {
    // Create test metrics
    const metricIds = await createTestMetrics(3);

    const validCombinationsYaml = `
name: Column Combinations Dashboard
description: Dashboard testing different valid column combinations
rows:
  - id: 1
    items:
      - id: ${metricIds[0]}
      - id: ${metricIds[1]}
    columnSizes:
      - 4
      - 8
  - id: 2
    items:
      - id: ${metricIds[2]}
    columnSizes:
      - 12
    `;

    const input = {
      files: [{ name: 'Column Combinations Dashboard', yml_content: validCombinationsYaml }],
      runtimeContext: mockRuntimeContext,
    };

    const result = await createDashboardsFileTool.execute({ context: input });

    expect(result.files).toHaveLength(1);
    expect(result.failed_files).toHaveLength(0);
    expect(result.files[0].name).toBe('Column Combinations Dashboard');

    // Track created dashboard for cleanup
    createdDashboardIds.push(result.files[0].id);
  });
});
