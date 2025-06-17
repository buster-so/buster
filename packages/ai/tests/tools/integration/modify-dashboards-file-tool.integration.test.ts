import { randomUUID } from 'node:crypto';
import { dashboardFiles, db, inArray, metricFiles } from '@buster/database';
import { afterEach, beforeEach, describe } from 'vitest';
//import { modifyDashboardsFileTool } from '../../../src/tools/visualization-tools/modify-dashboards-file-tool';

describe('Modify Dashboards File Tool Integration Tests', () => {
  let mockRuntimeContext: Record<string, unknown>;
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

  // Helper function to create test dashboard for modification testing
  async function createTestDashboard(metricIds: string[]): Promise<string> {
    const dashboardId = randomUUID();
    const dashboardYml = {
      name: 'Original Test Dashboard',
      description: 'Original dashboard for modification testing',
      rows: [
        {
          id: 1,
          items: metricIds.slice(0, Math.min(metricIds.length, 2)).map((id) => ({ id })),
          columnSizes: metricIds.length === 1 ? [12] : [6, 6],
        },
      ],
    };

    await db
      .insert(dashboardFiles)
      .values({
        id: dashboardId,
        name: 'Original Test Dashboard',
        fileName: 'original-test-dashboard',
        content: dashboardYml,
        filter: null,
        organizationId: testOrgId,
        createdBy: testUserId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
        publiclyAccessible: false,
        publiclyEnabledBy: null,
        publicExpiryDate: null,
        versionHistory: {
          versions: [
            {
              versionNumber: 1,
              content: dashboardYml,
              createdAt: new Date().toISOString(),
            },
          ],
        },
        publicPassword: null,
      })
      .execute();

    createdDashboardIds.push(dashboardId);
    return dashboardId;
  }
  /*
  test('should have correct tool configuration', () => {
    expect(modifyDashboardsFileTool.id).toBe('modify-dashboards-file');
    expect(modifyDashboardsFileTool.description).toContain(
      'Updates existing dashboard configuration files'
    );
    expect(modifyDashboardsFileTool.inputSchema).toBeDefined();
    expect(modifyDashboardsFileTool.outputSchema).toBeDefined();
    expect(modifyDashboardsFileTool.execute).toBeDefined();
  });

  test('should validate tool input schema', () => {
    const validInput = {
      files: [
        {
          id: randomUUID(),
          yml_content: `
name: Updated Sales Dashboard
description: An updated comprehensive view of sales metrics
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

    const result = modifyDashboardsFileTool.inputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  test('should validate tool output schema', () => {
    const validOutput = {
      message: 'Successfully modified 1 dashboard file.',
      duration: 1000,
      files: [
        {
          id: randomUUID(),
          name: 'Updated Test Dashboard',
          file_type: 'dashboard',
          yml_content: 'name: Updated Test Dashboard',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          version_number: 2,
        },
      ],
      failed_files: [],
    };

    const result = modifyDashboardsFileTool.outputSchema.safeParse(validOutput);
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
name: Test Updated Dashboard
description: Test updated dashboard
rows:
  - id: 1
    items:
      - id: f47ac10b-58cc-4372-a567-0e02b2c3d479
    columnSizes:
      - 12
    `;

    const input = {
      files: [{ id: randomUUID(), yml_content: validYaml }],
      runtimeContext: contextWithoutUserId,
    };

    await expect(modifyDashboardsFileTool.execute({ context: input })).rejects.toThrow(
      'User ID not found in runtime context'
    );
  });

  test('should reject modification of non-existent dashboard', async () => {
    const nonExistentId = randomUUID();
    const validYaml = `
name: Updated Dashboard
description: Updated dashboard
rows:
  - id: 1
    items:
      - id: f47ac10b-58cc-4372-a567-0e02b2c3d479
    columnSizes:
      - 12
    `;

    const input = {
      files: [{ id: nonExistentId, yml_content: validYaml }],
      runtimeContext: mockRuntimeContext,
    };

    const result = await modifyDashboardsFileTool.execute({ context: input });

    expect(result.files).toHaveLength(0);
    expect(result.failed_files).toHaveLength(1);
    expect(result.failed_files[0].file_name).toBe(`Dashboard ${nonExistentId}`);
    expect(result.failed_files[0].error).toContain('Dashboard file not found');
  });

  test('should reject dashboard modification with invalid YAML', async () => {
    // Create test metrics and dashboard
    const metricIds = await createTestMetrics(1);
    const dashboardId = await createTestDashboard(metricIds);

    const invalidYaml = `
name: Invalid Dashboard
description: Invalid dashboard
# Missing rows
    `;

    const input = {
      files: [{ id: dashboardId, yml_content: invalidYaml }],
      runtimeContext: mockRuntimeContext,
    };

    const result = await modifyDashboardsFileTool.execute({ context: input });

    expect(result.files).toHaveLength(0);
    expect(result.failed_files).toHaveLength(1);
    expect(result.failed_files[0].error).toContain('Failed to validate modified YAML');
  });

  test('should reject dashboard modification with invalid column sizes', async () => {
    // Create test metrics and dashboard
    const metricIds = await createTestMetrics(1);
    const dashboardId = await createTestDashboard(metricIds);

    const invalidColumnSizesYaml = `
name: Invalid Column Dashboard
description: Dashboard with invalid column sizes
rows:
  - id: 1
    items:
      - id: ${metricIds[0]}
    columnSizes:
      - 10
    `;

    const input = {
      files: [{ id: dashboardId, yml_content: invalidColumnSizesYaml }],
      runtimeContext: mockRuntimeContext,
    };

    const result = await modifyDashboardsFileTool.execute({ context: input });

    expect(result.files).toHaveLength(0);
    expect(result.failed_files).toHaveLength(1);
    expect(result.failed_files[0].error).toContain('Column sizes must sum to exactly 12');
  });

  test('should reject dashboard modification with non-existent metric IDs', async () => {
    // Create test metrics and dashboard
    const metricIds = await createTestMetrics(1);
    const dashboardId = await createTestDashboard(metricIds);

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
      files: [{ id: dashboardId, yml_content: nonExistentMetricYaml }],
      runtimeContext: mockRuntimeContext,
    };

    const result = await modifyDashboardsFileTool.execute({ context: input });

    expect(result.files).toHaveLength(0);
    expect(result.failed_files).toHaveLength(1);
    expect(result.failed_files[0].error).toContain('Invalid metric references');
  });

  test('should successfully modify dashboard with valid changes', async () => {
    // Create test metrics and dashboard
    const metricIds = await createTestMetrics(3);
    const dashboardId = await createTestDashboard(metricIds);

    const updatedDashboardYaml = `
name: Updated Valid Dashboard
description: An updated dashboard with valid changes
rows:
  - id: 1
    items:
      - id: ${metricIds[0]}
      - id: ${metricIds[1]}
    columnSizes:
      - 6
      - 6
  - id: 2
    items:
      - id: ${metricIds[2]}
    columnSizes:
      - 12
    `;

    const input = {
      files: [{ id: dashboardId, yml_content: updatedDashboardYaml }],
      runtimeContext: mockRuntimeContext,
    };

    const result = await modifyDashboardsFileTool.execute({ context: input });

    expect(result.files).toHaveLength(1);
    expect(result.failed_files).toHaveLength(0);
    expect(result.files[0].name).toBe('Updated Valid Dashboard');
    expect(result.files[0].file_type).toBe('dashboard');
    expect(result.files[0].version_number).toBe(2); // Should be incremented
    expect(result.message).toBe('Successfully modified 1 dashboard file.');

    // Verify database was updated
    const updatedDashboard = await db
      .select()
      .from(dashboardFiles)
      .where(eq(dashboardFiles.id, dashboardId))
      .execute();

    expect(updatedDashboard).toHaveLength(1);
    expect(updatedDashboard[0].name).toBe('Updated Valid Dashboard');
    expect(updatedDashboard[0].content.rows).toHaveLength(2);

    // Verify version history
    const versionHistory = updatedDashboard[0].versionHistory as never;
    expect(versionHistory.versions).toHaveLength(2);
    expect(versionHistory.versions[1].versionNumber).toBe(2);
    expect(versionHistory.versions[1].content.name).toBe('Updated Valid Dashboard');
  });

  test('should handle mixed success and failure scenarios', async () => {
    // Create test metrics and dashboards
    const metricIds = await createTestMetrics(2);
    const validDashboardId = await createTestDashboard(metricIds);
    const invalidDashboardId = randomUUID(); // Non-existent dashboard

    const validDashboardYaml = `
name: Valid Updated Dashboard
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
description: This should fail because dashboard doesn't exist
rows:
  - id: 1
    items:
      - id: ${metricIds[1]}
    columnSizes:
      - 12
    `;

    const input = {
      files: [
        { id: validDashboardId, yml_content: validDashboardYaml },
        { id: invalidDashboardId, yml_content: invalidDashboardYaml },
      ],
      runtimeContext: mockRuntimeContext,
    };

    const result = await modifyDashboardsFileTool.execute({ context: input });

    expect(result.files).toHaveLength(1);
    expect(result.failed_files).toHaveLength(1);

    // The success should be the valid dashboard
    expect(result.files[0].name).toBe('Valid Updated Dashboard');

    // The failure should be due to non-existent dashboard
    const failure = result.failed_files.find(
      (f) => f.file_name === `Dashboard ${invalidDashboardId}`
    );
    expect(failure?.error).toContain('Dashboard file not found');
  });

  test('should properly handle version number increments', async () => {
    // Create test metrics and dashboard
    const metricIds = await createTestMetrics(1);
    const dashboardId = await createTestDashboard(metricIds);

    // First modification
    const firstUpdateYaml = `
name: First Update
description: First update to the dashboard
rows:
  - id: 1
    items:
      - id: ${metricIds[0]}
    columnSizes:
      - 12
    `;

    const firstInput = {
      files: [{ id: dashboardId, yml_content: firstUpdateYaml }],
      runtimeContext: mockRuntimeContext,
    };

    const firstResult = await modifyDashboardsFileTool.execute({ context: firstInput });
    expect(firstResult.files[0].version_number).toBe(2);

    // Second modification
    const secondUpdateYaml = `
name: Second Update
description: Second update to the dashboard
rows:
  - id: 1
    items:
      - id: ${metricIds[0]}
    columnSizes:
      - 12
    `;

    const secondInput = {
      files: [{ id: dashboardId, yml_content: secondUpdateYaml }],
      runtimeContext: mockRuntimeContext,
    };

    const secondResult = await modifyDashboardsFileTool.execute({ context: secondInput });
    expect(secondResult.files[0].version_number).toBe(3);

    // Verify final database state
    const finalDashboard = await db
      .select()
      .from(dashboardFiles)
      .where(eq(dashboardFiles.id, dashboardId))
      .execute();

    const versionHistory = finalDashboard[0].versionHistory as never;
    expect(versionHistory.versions).toHaveLength(3);
    expect(versionHistory.versions[0].versionNumber).toBe(1);
    expect(versionHistory.versions[1].versionNumber).toBe(2);
    expect(versionHistory.versions[2].versionNumber).toBe(3);
  });

  test('should properly format response timing', async () => {
    // Create test metrics and dashboard
    const metricIds = await createTestMetrics(1);
    const dashboardId = await createTestDashboard(metricIds);

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
      files: [{ id: dashboardId, yml_content: validYaml }],
      runtimeContext: mockRuntimeContext,
    };

    const result = await modifyDashboardsFileTool.execute({ context: input });

    expect(result.duration).toBeGreaterThan(0);
    expect(typeof result.duration).toBe('number');
    expect(result.duration).toBeLessThan(10000); // Should complete within 10 seconds
  });

  test('should handle bulk dashboard modifications correctly', async () => {
    // Create test metrics and dashboards
    const metricIds = await createTestMetrics(3);
    const dashboardIds = await Promise.all([
      createTestDashboard([metricIds[0]]),
      createTestDashboard([metricIds[1]]),
      createTestDashboard([metricIds[2]]),
    ]);

    const createDashboardYaml = (index: number) => `
name: Bulk Updated Dashboard ${index}
description: Dashboard ${index} for bulk modification testing
rows:
  - id: 1
    items:
      - id: ${metricIds[index - 1]}
    columnSizes:
      - 12
    `;

    const files = dashboardIds.map((id, i) => ({
      id,
      yml_content: createDashboardYaml(i + 1),
    }));

    const input = {
      files,
      runtimeContext: mockRuntimeContext,
    };

    const result = await modifyDashboardsFileTool.execute({ context: input });

    expect(result.files).toHaveLength(3);
    expect(result.failed_files).toHaveLength(0);
    expect(result.message).toBe('Successfully modified 3 dashboard files.');

    // Verify all files have proper structure
    result.files.forEach((file, index) => {
      expect(file.file_type).toBe('dashboard');
      expect(file.version_number).toBe(2); // All should be version 2
      expect(file.name).toContain('Bulk Updated Dashboard');
      expect(file.yml_content).toContain(`Bulk Updated Dashboard ${index + 1}`);
    });
  });

  test('should handle complex dashboard modifications with multiple rows', async () => {
    // Create test metrics and dashboard
    const metricIds = await createTestMetrics(4);
    const dashboardId = await createTestDashboard(metricIds.slice(0, 2));

    const complexDashboardYaml = `
name: Complex Updated Dashboard
description: Dashboard with updated multiple rows and different layouts
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
      files: [{ id: dashboardId, yml_content: complexDashboardYaml }],
      runtimeContext: mockRuntimeContext,
    };

    const result = await modifyDashboardsFileTool.execute({ context: input });

    expect(result.files).toHaveLength(1);
    expect(result.failed_files).toHaveLength(0);
    expect(result.files[0].name).toBe('Complex Updated Dashboard');

    // Verify dashboard content in database
    const updatedDashboard = await db
      .select()
      .from(dashboardFiles)
      .where(eq(dashboardFiles.id, dashboardId))
      .execute();

    expect(updatedDashboard).toHaveLength(1);
    expect(updatedDashboard[0].content.rows).toHaveLength(3);
    expect(updatedDashboard[0].content.rows[0].items).toHaveLength(1);
    expect(updatedDashboard[0].content.rows[1].items).toHaveLength(2);
    expect(updatedDashboard[0].content.rows[2].items).toHaveLength(1);
  });

  test('should generate appropriate success and error messages', async () => {
    // Test success message
    const metricIds = await createTestMetrics(1);
    const dashboardId = await createTestDashboard(metricIds);

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
      files: [{ id: dashboardId, yml_content: validYaml }],
      runtimeContext: mockRuntimeContext,
    };

    const successResult = await modifyDashboardsFileTool.execute({ context: successInput });
    expect(successResult.message).toBe('Successfully modified 1 dashboard file.');

    // Test failure message
    const nonExistentId = randomUUID();
    const failureInput = {
      files: [{ id: nonExistentId, yml_content: validYaml }],
      runtimeContext: mockRuntimeContext,
    };

    const failureResult = await modifyDashboardsFileTool.execute({ context: failureInput });
    expect(failureResult.message).toBe('Failed to modify 1 dashboard file.');
  });

  test('should preserve dashboard structure when modifying with same metric count', async () => {
    // Create test metrics and dashboard
    const metricIds = await createTestMetrics(2);
    const dashboardId = await createTestDashboard(metricIds);

    const preserveStructureYaml = `
name: Structure Preserved Dashboard
description: Dashboard with preserved structure but updated content
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
      files: [{ id: dashboardId, yml_content: preserveStructureYaml }],
      runtimeContext: mockRuntimeContext,
    };

    const result = await modifyDashboardsFileTool.execute({ context: input });

    expect(result.files).toHaveLength(1);
    expect(result.failed_files).toHaveLength(0);
    expect(result.files[0].name).toBe('Structure Preserved Dashboard');

    // Verify database content
    const updatedDashboard = await db
      .select()
      .from(dashboardFiles)
      .where(eq(dashboardFiles.id, dashboardId))
      .execute();

    expect(updatedDashboard[0].content.rows[0].items).toHaveLength(2);
    expect(updatedDashboard[0].content.rows[0].columnSizes).toEqual([6, 6]);
  });

  */
});
