import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

interface DashboardFileParams {
  name: string;
  yml_content: string;
}

interface CreateDashboardFilesParams {
  files: DashboardFileParams[];
}

interface FileWithId {
  id: string;
  name: string;
  file_type: string;
  yml_content: string;
  result_message?: string;
  results?: any;
  created_at: string;
  updated_at: string;
  version_number: number;
}

interface FailedFileCreation {
  name: string;
  error: string;
}

interface CreateDashboardFilesOutput {
  message: string;
  duration: number;
  files: FileWithId[];
  failed_files: FailedFileCreation[];
}

export const createDashboardsTool = createTool({
  id: 'create-dashboards',
  description:
    "Creates **new** dashboard files. Use this if no existing dashboard file can fulfill the user's needs. Before using this tool, carefully think through the dashboard format, specification, and structure to ensure it meets requirements. Guard Rail: Do not execute any file creation or modifications until a thorough data catalog search has been completed and reviewed, and you have a clear understanding of the dashboard specification.",
  inputSchema: z.object({
    files: z
      .array(
        z.object({
          name: z
            .string()
            .describe(
              "The natural language name/title for the dashboard, exactly matching the 'name' field within the YML content. This name will identify the dashboard in the UI. Do not include file extensions or use file path characters."
            ),
          yml_content: z
            .string()
            .describe(
              'The complete YAML content for the dashboard file following the dashboard schema specification.'
            ),
        })
      )
      .describe('Array of dashboard files to create.'),
  }),
  outputSchema: z.object({
    message: z.string(),
    duration: z.number(),
    files: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        file_type: z.string(),
        yml_content: z.string(),
        result_message: z.string().optional(),
        results: z.any().optional(),
        created_at: z.string(),
        updated_at: z.string(),
        version_number: z.number(),
      })
    ),
    failed_files: z.array(
      z.object({
        name: z.string(),
        error: z.string(),
      })
    ),
  }),
  execute: async ({ context }) => {
    return await createDashboards(context as CreateDashboardFilesParams);
  },
});

const createDashboards = wrapTraced(
  async (params: CreateDashboardFilesParams): Promise<CreateDashboardFilesOutput> => {
    const startTime = Date.now();
    const { files } = params;

    const createdFiles: FileWithId[] = [];
    const failedFiles: FailedFileCreation[] = [];

    // TODO: Get actual user_id and organization_id from context/agent
    const userId = 'user_123'; // Placeholder
    const organizationId = 'org_456'; // Placeholder

    // Process dashboard files
    const dashboardRecords: any[] = [];
    const dashboardYmls: any[] = [];

    // First pass - validate and prepare all records
    for (const file of files) {
      try {
        const result = await processDashboardFile(file, userId, organizationId);
        dashboardRecords.push(result.dashboardFile);
        dashboardYmls.push(result.dashboardYml);
      } catch (error) {
        failedFiles.push({
          name: file.name,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Second pass - bulk insert records
    if (dashboardRecords.length > 0) {
      try {
        // TODO: Replace with actual database operations
        await bulkInsertDashboards(dashboardRecords);

        // Create asset permissions for each dashboard file
        for (const dashboardFile of dashboardRecords) {
          await createAssetPermission(dashboardFile.id, userId);
        }

        // Create associations between metrics and dashboards
        for (let i = 0; i < dashboardRecords.length; i++) {
          const dashboardRecord = dashboardRecords[i];
          const metricIds = extractMetricIds(dashboardRecord.content);

          if (metricIds.length > 0) {
            await createMetricDashboardAssociations(dashboardRecord.id, metricIds, userId);
          }
        }

        // Build successful files response
        for (let i = 0; i < dashboardYmls.length; i++) {
          const record = dashboardRecords[i];

          createdFiles.push({
            id: record.id,
            name: record.name,
            file_type: 'dashboard',
            yml_content: record.yml_content || '',
            created_at: record.created_at,
            updated_at: record.updated_at,
            version_number: 1,
          });
        }
      } catch (error) {
        // Move all records to failed if bulk operation fails
        failedFiles.push(
          ...dashboardRecords.map((r) => ({
            name: r.file_name,
            error: `Failed to create dashboard file: ${error instanceof Error ? error.message : String(error)}`,
          }))
        );
      }
    }

    const duration = Date.now() - startTime;

    // Generate result message
    const message = generateResultMessage(createdFiles.length, failedFiles);

    // TODO: Set agent state values if available
    if (createdFiles.length > 0) {
      // await agent.setStateValue('dashboards_available', true);
      // await agent.setStateValue('files_available', true);
    }

    // Set review_needed flag if execution was successful
    if (failedFiles.length === 0) {
      // await agent.setStateValue('review_needed', true);
    }

    return {
      message,
      duration,
      files: createdFiles,
      failed_files: failedFiles,
    };
  },
  { name: 'create-dashboards' }
);

async function processDashboardFile(
  file: DashboardFileParams,
  userId: string,
  organizationId: string
): Promise<{ dashboardFile: Record<string, any>; dashboardYml: Record<string, any> }> {
  console.log(`Processing dashboard file creation: ${file.name}`);

  // Parse and validate YAML content
  let dashboardYml: Record<string, any>;
  try {
    dashboardYml = parseYamlContent(file.yml_content);
  } catch (error) {
    throw new Error(
      `Invalid YAML format: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  const dashboardId = generateId();

  // Extract and validate metric IDs from dashboard content
  const metricIds = extractMetricIds(dashboardYml);

  if (metricIds.length > 0) {
    const missingIds = await validateMetricIds(metricIds);
    if (missingIds.length > 0) {
      throw new Error(`Invalid metric references: ${missingIds.join(', ')}`);
    }
  }

  const now = new Date().toISOString();

  const dashboardFile = {
    id: dashboardId,
    name: dashboardYml.name || file.name,
    file_name: file.name,
    content: dashboardYml,
    yml_content: file.yml_content,
    filter: null,
    organization_id: organizationId,
    created_by: userId,
    created_at: now,
    updated_at: now,
    deleted_at: null,
    publicly_accessible: false,
    publicly_enabled_by: null,
    public_expiry_date: null,
    version_history: {
      version: 1,
      content: dashboardYml,
    },
    public_password: null,
  };

  return { dashboardFile, dashboardYml };
}

function parseYamlContent(ymlContent: string): Record<string, any> {
  // TODO: Replace with actual YAML parsing library
  try {
    // Simple validation - in real implementation use proper YAML parser
    const parsed = JSON.parse(ymlContent); // Temporary - should use yaml parser

    if (!parsed.name) {
      throw new Error('Dashboard YAML must include a name field');
    }

    return parsed;
  } catch (error) {
    throw new Error(
      `Failed to parse YAML: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

function extractMetricIds(dashboardContent: Record<string, any>): string[] {
  // Extract metric IDs from dashboard rows/items
  const metricIds: string[] = [];

  if (dashboardContent.rows && Array.isArray(dashboardContent.rows)) {
    for (const row of dashboardContent.rows) {
      if (row.items && Array.isArray(row.items)) {
        for (const item of row.items) {
          if (item.id) {
            metricIds.push(item.id);
          }
        }
      }
    }
  }

  return metricIds;
}

async function validateMetricIds(metricIds: string[]): Promise<string[]> {
  // TODO: Replace with actual database validation
  const existingMetrics = [
    'metric_abc123_1',
    'metric_def456_2',
    'metric_ghi789_3',
    'metric_jkl012_4',
  ];

  const missingIds = metricIds.filter((id) => !existingMetrics.includes(id));

  if (missingIds.length > 0) {
    console.log(`Missing metric IDs: ${missingIds.join(', ')}`);
  }

  return missingIds;
}

async function bulkInsertDashboards(dashboardRecords: Record<string, any>[]): Promise<void> {
  // TODO: Replace with actual database bulk insert
  console.log(`Bulk inserting ${dashboardRecords.length} dashboard records`);

  // Simulate database operation
  for (const record of dashboardRecords) {
    console.log('Inserted dashboard:', record.id);
  }
}

async function createAssetPermission(dashboardId: string, userId: string): Promise<void> {
  // TODO: Replace with actual database operation
  console.log('Created asset permission for dashboard:', dashboardId);
}

async function createMetricDashboardAssociations(
  dashboardId: string,
  metricIds: string[],
  userId: string
): Promise<void> {
  // TODO: Replace with actual database operation
  const associations = metricIds.map((metricId) => ({
    metric_file_id: metricId,
    dashboard_file_id: dashboardId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    created_by: userId,
  }));

  console.log(
    `Created ${associations.length} metric-to-dashboard associations for dashboard ${dashboardId}`
  );
}

function generateResultMessage(successCount: number, failedFiles: FailedFileCreation[]): string {
  if (failedFiles.length === 0) {
    return `Successfully created ${successCount} dashboard files.`;
  }

  const successMsg =
    successCount > 0 ? `Successfully created ${successCount} dashboard files. ` : '';

  const failures = failedFiles.map(
    (failure) => `Failed to create '${failure.name}': ${failure.error}`
  );

  if (failures.length === 1) {
    return `${successMsg.trim()}${failures[0]}.`;
  }

  return `${successMsg}Failed to create ${failures.length} dashboard files:\n${failures.join('\n')}`;
}

function generateId(): string {
  return `dash_${Math.random().toString(36).substr(2, 9)}_${Date.now().toString(36)}`;
}
