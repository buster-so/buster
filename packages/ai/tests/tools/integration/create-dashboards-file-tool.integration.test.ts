import { randomUUID } from 'node:crypto';
import {
  dashboardFiles,
  db,
  eq,
  inArray,
  metricFiles,
  metricFilesToDashboardFiles,
} from '@buster/database';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { createDashboards } from '../../../src/tools/visualization-tools/create-dashboards-file-tool';
import { validateArrayAccess } from '../../../src/utils/validation-helpers';

// Type for runtime context
type MockRuntimeContext = {
  get: (key: string) => string | undefined;
};

describe('Create Dashboards File Tool Integration Tests', () => {
  let mockRuntimeContext: MockRuntimeContext;
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
          userId: testUserId,
          organizationId: testOrgId,
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
    expect(createDashboards.id).toBe('create-dashboards-file');
    expect(createDashboards.description).toContain('Creates dashboard configuration files');
    expect(createDashboards.inputSchema).toBeDefined();
    expect(createDashboards.outputSchema).toBeDefined();
    expect(createDashboards.execute).toBeDefined();
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

    const result = createDashboards.inputSchema.safeParse(validInput);
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

    const result = createDashboards.outputSchema.safeParse(validOutput);
    expect(result.success).toBe(true);
  });

  test('should handle runtime context requirements', async () => {
    const contextWithoutUserId = {
      get: (key: string) => {
        if (key === 'userId') return undefined;
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

    const result = await createDashboards.execute({
      context: input,
      runtimeContext: contextWithoutUserId as unknown as RuntimeContext,
    });
    expect(result.message).toBe('Unable to verify your identity. Please log in again.');
    expect(result.files).toHaveLength(0);
    expect(result.failed_files).toHaveLength(0);
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

    const result = await createDashboards.execute({
      context: input,
      runtimeContext: mockRuntimeContext as unknown as RuntimeContext,
    });

    expect(result.files).toHaveLength(0);
    expect(result.failed_files).toHaveLength(1);
    const failedFile = validateArrayAccess(result.failed_files, 0, 'failed_files access');
    expect(failedFile.name).toBe('Invalid Dashboard');
    expect(failedFile.error).toContain('dashboard configuration format is incorrect');
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

    const result = await createDashboards.execute({
      context: input,
      runtimeContext: mockRuntimeContext as unknown as RuntimeContext,
    });

    expect(result.files).toHaveLength(0);
    expect(result.failed_files).toHaveLength(1);
    const failedFile = validateArrayAccess(result.failed_files, 0, 'failed_files access');
    expect(failedFile.error).toContain('dashboard configuration format is incorrect');
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

    const result = await createDashboards.execute({
      context: input,
      runtimeContext: mockRuntimeContext as unknown as RuntimeContext,
    });

    expect(result.files).toHaveLength(0);
    expect(result.failed_files).toHaveLength(1);
    const failedFile = validateArrayAccess(result.failed_files, 0, 'failed_files access');
    expect(failedFile.error).toContain('metrics referenced in the dashboard do not exist');
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

    const result = await createDashboards.execute({
      context: input,
      runtimeContext: mockRuntimeContext as unknown as RuntimeContext,
    });

    expect(result.files).toHaveLength(1);
    expect(result.failed_files).toHaveLength(0);
    const createdFile = validateArrayAccess(result.files, 0, 'files access');
    expect(createdFile.name).toBe('Valid Dashboard');
    expect(createdFile.file_type).toBe('dashboard');
    expect(createdFile.version_number).toBe(1);
    expect(result.message).toBe('Successfully created 1 dashboard files.');

    // Track created dashboard for cleanup
    createdDashboardIds.push(createdFile.id);

    // Verify metric-dashboard associations were created
    const associations = await db
      .select()
      .from(metricFilesToDashboardFiles)
      .where(eq(metricFilesToDashboardFiles.dashboardFileId, createdFile.id))
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

    const result = await createDashboards.execute({
      context: input,
      runtimeContext: mockRuntimeContext as unknown as RuntimeContext,
    });

    expect(result.files).toHaveLength(1);
    expect(result.failed_files).toHaveLength(1);

    // The success should be the valid dashboard
    const createdFile = validateArrayAccess(result.files, 0, 'files access');
    expect(createdFile.name).toBe('Valid Dashboard');

    // The failure should be due to invalid metric reference
    const failure = result.failed_files.find((f) => f.name === 'Invalid Dashboard');
    expect(failure?.error).toContain('metrics referenced in the dashboard do not exist');

    // Track created dashboard for cleanup
    createdDashboardIds.push(createdFile.id);
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

    const result = await createDashboards.execute({
      context: input,
      runtimeContext: mockRuntimeContext as unknown as RuntimeContext,
    });

    expect(result.duration).toBeGreaterThan(0);
    expect(typeof result.duration).toBe('number');
    expect(result.duration).toBeLessThan(10000); // Should complete within 10 seconds

    // Track created dashboard for cleanup
    if (result.files.length > 0) {
      const createdFile = validateArrayAccess(result.files, 0, 'files access');
      createdDashboardIds.push(createdFile.id);
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

    const result = await createDashboards.execute({
      context: input,
      runtimeContext: mockRuntimeContext as unknown as RuntimeContext,
    });

    expect(result.files).toHaveLength(3);
    expect(result.failed_files).toHaveLength(0);
    expect(result.message).toBe('Successfully created 3 dashboard files.');

    // Verify all files have proper structure
    for (const file of result.files) {
      expect(file.file_type).toBe('dashboard');
      expect(file.version_number).toBe(1);
      expect(file.name).toContain('Bulk Dashboard');
      // Note: yml_content is not returned in the output schema
    }

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

    const result = await createDashboards.execute({
      context: input,
      runtimeContext: mockRuntimeContext as unknown as RuntimeContext,
    });

    expect(result.files).toHaveLength(1);
    expect(result.failed_files).toHaveLength(0);
    const createdFile = validateArrayAccess(result.files, 0, 'files access');
    expect(createdFile.name).toBe('Complex Dashboard');

    // Track created dashboard for cleanup
    createdDashboardIds.push(createdFile.id);

    // Verify all metric-dashboard associations were created
    const associations = await db
      .select()
      .from(metricFilesToDashboardFiles)
      .where(eq(metricFilesToDashboardFiles.dashboardFileId, createdFile.id))
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

    const result = await createDashboards.execute({
      context: input,
      runtimeContext: mockRuntimeContext as unknown as RuntimeContext,
    });

    expect(result.files).toHaveLength(1);
    expect(result.failed_files).toHaveLength(0);
    const createdFile = validateArrayAccess(result.files, 0, 'files access');
    expect(createdFile.name).toBe('Max Items Dashboard');

    // Track created dashboard for cleanup
    createdDashboardIds.push(createdFile.id);

    // Verify dashboard content
    const dashboardFile = await db
      .select()
      .from(dashboardFiles)
      .where(eq(dashboardFiles.id, createdFile.id))
      .execute();

    expect(dashboardFile).toHaveLength(1);
    const dashboard = validateArrayAccess(dashboardFile, 0, 'dashboardFile access');
    // Define a minimal type for dashboard content
    interface DashboardContent {
      rows: Array<{
        items: unknown[];
        columnSizes: number[];
      }>;
    }
    const content = dashboard.content as DashboardContent;
    const firstRow = validateArrayAccess(content.rows, 0, 'rows access');
    expect(firstRow.items).toHaveLength(4);
    expect(firstRow.columnSizes).toEqual([3, 3, 3, 3]);
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

    const successResult = await createDashboards.execute({
      context: successInput,
      runtimeContext: mockRuntimeContext as unknown as RuntimeContext,
    });
    expect(successResult.message).toBe('Successfully created 1 dashboard files.');

    // Track created dashboard for cleanup
    if (successResult.files.length > 0) {
      const createdFile = validateArrayAccess(successResult.files, 0, 'files access');
      createdDashboardIds.push(createdFile.id);
    }

    // Test failure message
    const invalidYaml = 'invalid yaml structure for dashboard';

    const failureInput = {
      files: [{ name: 'Failure Test', yml_content: invalidYaml }],
      runtimeContext: mockRuntimeContext,
    };

    const failureResult = await createDashboards.execute({
      context: failureInput,
      runtimeContext: mockRuntimeContext as unknown as RuntimeContext,
    });
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

    const result = await createDashboards.execute({
      context: input,
      runtimeContext: mockRuntimeContext as unknown as RuntimeContext,
    });

    expect(result.files).toHaveLength(1);
    expect(result.failed_files).toHaveLength(0);
    const createdFile = validateArrayAccess(result.files, 0, 'files access');
    expect(createdFile.name).toBe('Column Combinations Dashboard');

    // Track created dashboard for cleanup
    createdDashboardIds.push(createdFile.id);
  });
});
