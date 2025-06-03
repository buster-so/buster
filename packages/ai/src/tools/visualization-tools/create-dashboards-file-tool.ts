import { randomUUID } from 'node:crypto';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { inArray } from 'drizzle-orm';
import * as yaml from 'yaml';
import { z } from 'zod';
import { db } from '../../../../database/src/connection';
import {
  dashboardFiles,
  metricFiles,
  metricFilesToDashboardFiles,
} from '../../../../database/src/schema';

// Core interfaces matching Rust structs
interface DashboardFileParams {
  name: string;
  yml_content: string;
}

interface CreateDashboardFilesParams {
  files: DashboardFileParams[];
}

interface FailedFileCreation {
  name: string;
  error: string;
}

interface FileWithId {
  id: string;
  name: string;
  file_type: string;
  yml_content: string;
  result_message?: string;
  results?: Record<string, any>[];
  created_at: string;
  updated_at: string;
  version_number: number;
}

interface CreateDashboardFilesOutput {
  message: string;
  duration: number;
  files: FileWithId[];
  failed_files: FailedFileCreation[];
}

// Dashboard YAML schema validation with full rules
const dashboardItemSchema = z.object({
  id: z.string().uuid('Must be a valid UUID for an existing metric'),
});

const dashboardRowSchema = z
  .object({
    id: z.number().int().positive('Row ID must be a positive integer'),
    items: z
      .array(dashboardItemSchema)
      .min(1, 'Each row must have at least 1 item')
      .max(4, 'Each row can have at most 4 items'),
    columnSizes: z
      .array(
        z
          .number()
          .int()
          .min(3, 'Each column size must be at least 3')
          .max(12, 'Each column size cannot exceed 12')
      )
      .min(1, 'columnSizes array cannot be empty')
      .refine((sizes) => sizes.reduce((sum, size) => sum + size, 0) === 12, {
        message: 'Column sizes must sum to exactly 12',
      }),
  })
  .refine((row) => row.items.length === row.columnSizes.length, {
    message: 'Number of items must match number of column sizes',
  });

const dashboardYmlSchema = z.object({
  name: z.string().min(1, 'Dashboard name is required'),
  description: z.string().min(1, 'Dashboard description is required'),
  rows: z
    .array(dashboardRowSchema)
    .min(1, 'Dashboard must have at least one row')
    .refine(
      (rows) => {
        const ids = rows.map((row) => row.id);
        const uniqueIds = new Set(ids);
        return ids.length === uniqueIds.size;
      },
      {
        message: 'All row IDs must be unique',
      }
    ),
});

// Parse and validate dashboard YAML content
function parseAndValidateYaml(ymlContent: string): {
  success: boolean;
  error?: string;
  data?: any;
} {
  try {
    const parsedYml = yaml.parse(ymlContent);
    const validationResult = dashboardYmlSchema.safeParse(parsedYml);

    if (!validationResult.success) {
      return {
        success: false,
        error: `Invalid YAML structure: ${validationResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
      };
    }

    return { success: true, data: validationResult.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'YAML parsing failed',
    };
  }
}

// Validate that all referenced metric IDs exist in the database
async function validateMetricIds(
  metricIds: string[]
): Promise<{ success: boolean; missingIds?: string[]; error?: string }> {
  if (metricIds.length === 0) {
    return { success: true };
  }

  try {
    const existingMetrics = await db
      .select({ id: metricFiles.id })
      .from(metricFiles)
      .where(inArray(metricFiles.id, metricIds))
      .execute();

    const existingIds = existingMetrics.map((m) => m.id);
    const missingIds = metricIds.filter((id) => !existingIds.includes(id));

    if (missingIds.length > 0) {
      return { success: false, missingIds };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate metric IDs',
    };
  }
}

// Process a dashboard file creation request
async function processDashboardFile(
  toolCallId: string,
  file: DashboardFileParams,
  userId: string,
  organizationId: string
): Promise<{ success: boolean; dashboardFile?: any; dashboardYml?: any; error?: string }> {
  // Parse and validate YAML
  const yamlValidation = parseAndValidateYaml(file.yml_content);
  if (!yamlValidation.success) {
    return {
      success: false,
      error: `Invalid YAML format: ${yamlValidation.error}`,
    };
  }

  const dashboardYml = yamlValidation.data;

  // Generate deterministic UUID for dashboard
  const dashboardId = randomUUID(); // Simplified - in real implementation would be deterministic

  // Collect all metric IDs from rows
  const metricIds: string[] = dashboardYml.rows
    .flatMap((row: any) => row.items)
    .map((item: any) => item.id);

  // Validate metric IDs if any exist
  if (metricIds.length > 0) {
    const metricValidation = await validateMetricIds(metricIds);
    if (!metricValidation.success) {
      if (metricValidation.missingIds) {
        return {
          success: false,
          error: `Invalid metric references: ${metricValidation.missingIds.join(', ')}`,
        };
      }
      return {
        success: false,
        error: `Failed to validate metrics: ${metricValidation.error}`,
      };
    }
  }

  const dashboardFile = {
    id: dashboardId,
    name: dashboardYml.name,
    fileName: file.name,
    content: dashboardYml,
    filter: null,
    organizationId,
    createdBy: userId,
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
  };

  return {
    success: true,
    dashboardFile,
    dashboardYml,
  };
}

// Main create dashboard files function
const createDashboardFiles = wrapTraced(
  async (
    params: CreateDashboardFilesParams,
    runtimeContext: RuntimeContext
  ): Promise<CreateDashboardFilesOutput> => {
    const startTime = Date.now();

    // Get runtime context values
    const userId = runtimeContext?.get('userId');
    const organizationId = runtimeContext?.get('organizationId');

    if (!userId) {
      throw new Error('User ID not found in runtime context');
    }
    if (!organizationId) {
      throw new Error('Organization ID not found in runtime context');
    }

    const files: FileWithId[] = [];
    const failedFiles: FailedFileCreation[] = [];

    try {
      // Process dashboard files
      const dashboardRecords: any[] = [];
      const dashboardYmls: any[] = [];

      // First pass - validate and prepare all records
      for (const file of params.files) {
        const result = await processDashboardFile(
          'dashboard-creation', // Simplified tool call ID
          file,
          userId,
          organizationId
        );

        if (result.success && result.dashboardFile && result.dashboardYml) {
          dashboardRecords.push(result.dashboardFile);
          dashboardYmls.push(result.dashboardYml);
        } else {
          failedFiles.push({
            name: file.name,
            error: result.error || 'Unknown error',
          });
        }
      }

      // Second pass - bulk insert records
      if (dashboardRecords.length > 0) {
        // Insert dashboard files
        for (const dashboardRecord of dashboardRecords) {
          await db
            .insert(dashboardFiles)
            .values({
              id: dashboardRecord.id,
              name: dashboardRecord.name,
              fileName: dashboardRecord.fileName,
              content: dashboardRecord.content,
              filter: dashboardRecord.filter,
              organizationId: dashboardRecord.organizationId,
              createdBy: dashboardRecord.createdBy,
              createdAt: dashboardRecord.createdAt,
              updatedAt: dashboardRecord.updatedAt,
              deletedAt: dashboardRecord.deletedAt,
              publiclyAccessible: dashboardRecord.publiclyAccessible,
              publiclyEnabledBy: dashboardRecord.publiclyEnabledBy,
              publicExpiryDate: dashboardRecord.publicExpiryDate,
              versionHistory: dashboardRecord.versionHistory,
              publicPassword: dashboardRecord.publicPassword,
            })
            .execute();
        }

        // Create associations between metrics and dashboards
        for (const dashboardRecord of dashboardRecords) {
          const metricIds: string[] = dashboardRecord.content.rows
            .flatMap((row: any) => row.items)
            .map((item: any) => item.id);

          if (metricIds.length > 0) {
            const metricDashboardAssociations = metricIds.map((metricId: string) => ({
              metricFileId: metricId,
              dashboardFileId: dashboardRecord.id,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              deletedAt: null,
              createdBy: userId,
            }));

            // Insert associations with conflict handling
            for (const association of metricDashboardAssociations) {
              try {
                await db.insert(metricFilesToDashboardFiles).values(association).execute();
              } catch (error) {
                // Log warning but don't fail the whole operation
                console.warn(`Failed to create metric-dashboard association: ${error}`);
              }
            }
          }
        }

        // Add successful files to output
        for (let i = 0; i < dashboardRecords.length; i++) {
          const dashboardRecord = dashboardRecords[i];
          const dashboardYml = dashboardYmls[i];

          files.push({
            id: dashboardRecord.id,
            name: dashboardRecord.name,
            file_type: 'dashboard',
            yml_content: yaml.stringify(dashboardYml),
            result_message: undefined,
            results: undefined,
            created_at: dashboardRecord.createdAt,
            updated_at: dashboardRecord.updatedAt,
            version_number: 1,
          });
        }
      }
    } catch (error) {
      return {
        message: `Failed to create dashboard files: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        files: [],
        failed_files: [],
      };
    }

    // Generate result message
    const successCount = files.length;
    const failureCount = failedFiles.length;

    let message: string;
    if (successCount > 0 && failureCount === 0) {
      message = `Successfully created ${successCount} dashboard file${successCount === 1 ? '' : 's'}.`;
    } else if (successCount === 0 && failureCount > 0) {
      if (failureCount === 1) {
        message = `Failed to create '${failedFiles[0].name}': ${failedFiles[0].error}.`;
      } else {
        const failures = failedFiles
          .map((failure) => `Failed to create '${failure.name}': ${failure.error}`)
          .join('\n');
        message = `Failed to create ${failureCount} dashboard files:\n${failures}`;
      }
    } else if (successCount > 0 && failureCount > 0) {
      const successMsg = `Successfully created ${successCount} dashboard file${successCount === 1 ? '' : 's'}. `;
      const failures = failedFiles
        .map((failure) => `Failed to create '${failure.name}': ${failure.error}`)
        .join('\n');
      message = `${successMsg}Failed to create ${failureCount} dashboard files:\n${failures}`;
    } else {
      message = 'No dashboard files were processed.';
    }

    return {
      message,
      duration: Date.now() - startTime,
      files,
      failed_files: failedFiles,
    };
  },
  { name: 'create-dashboard-files' }
);

// Input/Output schemas
const inputSchema = z.object({
  files: z
    .array(
      z.object({
        name: z.string().min(1, 'Dashboard name cannot be empty'),
        yml_content: z.string().min(1, 'YAML content cannot be empty'),
      })
    )
    .min(1, 'At least one dashboard file must be provided'),
});

const outputSchema = z.object({
  message: z.string(),
  duration: z.number(),
  files: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      file_type: z.string(),
      yml_content: z.string(),
      result_message: z.string().optional(),
      results: z.array(z.record(z.any())).optional(),
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
});

// Export the tool
export const createDashboardsFileTool = createTool({
  id: 'create-dashboards-file',
  description:
    "Creates new dashboard files. Use this if no existing dashboard file can fulfill the user's needs. Before using this tool, carefully think through the dashboard format, specification, and structure to ensure it meets requirements. Each dashboard references existing metrics by their UUIDs and organizes them into rows with specific column layouts.",
  inputSchema,
  outputSchema,
  execute: async ({ context, runtimeContext }) => {
    return await createDashboardFiles(context as CreateDashboardFilesParams, runtimeContext);
  },
});

export default createDashboardsFileTool;
