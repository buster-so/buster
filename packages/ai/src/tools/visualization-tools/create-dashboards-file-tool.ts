import { randomUUID } from 'node:crypto';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { inArray } from 'drizzle-orm';
import * as yaml from 'yaml';
import { z } from 'zod';
import { db } from '../../../../database/src/connection';
import {
  assetPermissions,
  dashboardFiles,
  metricFiles,
  metricFilesToDashboardFiles,
} from '../../../../database/src/schema';

// Core interfaces matching Rust structs exactly
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

// Row item schema matching Rust RowItem
const rowItemSchema = z.object({
  id: z.string().uuid('Must be a valid UUID for an existing metric'),
});

// Row schema matching Rust Row struct exactly
const rowSchema = z.object({
  id: z.number().int().positive('Row ID must be a positive integer'),
  items: z
    .array(rowItemSchema)
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
  rowHeight: z
    .number()
    .int()
    .min(320, 'Row height must be at least 320')
    .max(550, 'Row height cannot exceed 550')
    .optional(),
});

// Dashboard YAML schema matching Rust DashboardYml struct exactly
const dashboardYmlSchema = z
  .object({
    name: z.string().min(1, 'Dashboard name is required'),
    description: z.string().optional(),
    rows: z
      .array(rowSchema)
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
  })
  .refine(
    (dashboard) => {
      // Validate each row structure and column constraints
      return dashboard.rows.every((row) => {
        // Check that number of items matches number of column sizes
        if (row.items.length !== row.columnSizes.length) {
          return false;
        }

        // Check column size constraints
        const sum = row.columnSizes.reduce((acc, size) => acc + size, 0);
        if (sum !== 12) {
          return false;
        }

        // Check minimum column size
        return row.columnSizes.every((size) => size >= 3);
      });
    },
    {
      message:
        'Invalid row configuration: items must match column sizes, sizes must sum to 12, and each size must be >= 3',
    }
  );

type DashboardYml = z.infer<typeof dashboardYmlSchema>;

// Parse and validate dashboard YAML content
function parseAndValidateYaml(ymlContent: string): {
  success: boolean;
  error?: string;
  data?: DashboardYml;
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
  file: DashboardFileParams,
  userId: string,
  organizationId: string
): Promise<{ success: boolean; dashboardFile?: any; dashboardYml?: DashboardYml; error?: string }> {
  // Parse and validate YAML
  const yamlValidation = parseAndValidateYaml(file.yml_content);
  if (!yamlValidation.success) {
    return {
      success: false,
      error: `Invalid YAML format: ${yamlValidation.error}`,
    };
  }

  const dashboardYml = yamlValidation.data!;

  // Generate deterministic UUID for dashboard
  const dashboardId = randomUUID(); // Simplified - in real implementation would be deterministic

  // Collect all metric IDs from rows
  const metricIds: string[] = dashboardYml.rows.flatMap((row) => row.items).map((item) => item.id);

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
    const userId = runtimeContext?.get('userId') as string;
    const organizationId = runtimeContext?.get('organizationId') as string;

    if (!userId) {
      throw new Error('User ID not found in runtime context');
    }
    if (!organizationId) {
      throw new Error('Organization ID not found in runtime context');
    }

    const files: FileWithId[] = [];
    const failedFiles: FailedFileCreation[] = [];

    // Process files concurrently
    const processResults = await Promise.allSettled(
      params.files.map(async (file) => {
        const result = await processDashboardFile(file, userId, organizationId);
        return { fileName: file.name, result };
      })
    );

    const successfulProcessing: Array<{
      dashboardFile: any;
      dashboardYml: DashboardYml;
    }> = [];

    // Separate successful from failed processing
    for (const processResult of processResults) {
      if (processResult.status === 'fulfilled') {
        const { fileName, result } = processResult.value;
        if (result.success) {
          successfulProcessing.push({
            dashboardFile: result.dashboardFile!,
            dashboardYml: result.dashboardYml!,
          });
        } else {
          failedFiles.push({
            name: fileName,
            error: result.error || 'Unknown error',
          });
        }
      } else {
        failedFiles.push({
          name: 'unknown',
          error: processResult.reason?.message || 'Processing failed',
        });
      }
    }

    // Database operations
    if (successfulProcessing.length > 0) {
      try {
        await db.transaction(async (tx) => {
          // Insert dashboard files
          const dashboardRecords = successfulProcessing.map((sp) => ({
            id: sp.dashboardFile.id,
            name: sp.dashboardFile.name,
            fileName: sp.dashboardFile.fileName,
            content: sp.dashboardFile.content,
            filter: sp.dashboardFile.filter,
            organizationId: sp.dashboardFile.organizationId,
            createdBy: sp.dashboardFile.createdBy,
            createdAt: sp.dashboardFile.createdAt,
            updatedAt: sp.dashboardFile.updatedAt,
            deletedAt: sp.dashboardFile.deletedAt,
            publiclyAccessible: sp.dashboardFile.publiclyAccessible,
            publiclyEnabledBy: sp.dashboardFile.publiclyEnabledBy,
            publicExpiryDate: sp.dashboardFile.publicExpiryDate,
            versionHistory: sp.dashboardFile.versionHistory,
            publicPassword: sp.dashboardFile.publicPassword,
          }));
          await tx.insert(dashboardFiles).values(dashboardRecords);

          // Insert asset permissions
          const assetPermissionRecords = dashboardRecords.map((record) => ({
            identityId: userId,
            identityType: 'user' as const,
            assetId: record.id,
            assetType: 'dashboard_file' as const,
            role: 'owner' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: null,
            createdBy: userId,
            updatedBy: userId,
          }));
          await tx.insert(assetPermissions).values(assetPermissionRecords);

          // Create associations between metrics and dashboards
          for (const sp of successfulProcessing) {
            const metricIds: string[] = sp.dashboardFile.content.rows
              .flatMap((row: any) => row.items)
              .map((item: any) => item.id);

            if (metricIds.length > 0) {
              const metricDashboardAssociations = metricIds.map((metricId: string) => ({
                metricFileId: metricId,
                dashboardFileId: sp.dashboardFile.id,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                deletedAt: null,
                createdBy: userId,
              }));

              // Insert associations with conflict handling
              for (const association of metricDashboardAssociations) {
                try {
                  await tx.insert(metricFilesToDashboardFiles).values(association);
                } catch (error) {
                  // Log warning but don't fail the whole operation
                  console.warn(`Failed to create metric-dashboard association: ${error}`);
                }
              }
            }
          }
        });

        // Add successful files to output
        for (const sp of successfulProcessing) {
          files.push({
            id: sp.dashboardFile.id,
            name: sp.dashboardFile.name,
            file_type: 'dashboard',
            yml_content: yaml.stringify(sp.dashboardYml),
            result_message: undefined,
            results: undefined,
            created_at: sp.dashboardFile.createdAt,
            updated_at: sp.dashboardFile.updatedAt,
            version_number: 1,
          });
        }
      } catch (error) {
        // Add all successful processing to failed if database operation fails
        for (const sp of successfulProcessing) {
          failedFiles.push({
            name: sp.dashboardFile.name,
            error: `Failed to save to database: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        }
      }
    }

    const duration = Date.now() - startTime;
    const message = generateResultMessage(files, failedFiles);

    return {
      message,
      duration,
      files,
      failed_files: failedFiles,
    };
  },
  { name: 'create-dashboard-files' }
);

function generateResultMessage(
  createdFiles: FileWithId[],
  failedFiles: FailedFileCreation[]
): string {
  if (failedFiles.length === 0) {
    return `Successfully created ${createdFiles.length} dashboard files.`;
  }

  const successMsg =
    createdFiles.length > 0 ? `Successfully created ${createdFiles.length} dashboard files. ` : '';

  const failures = failedFiles.map(
    (failure) =>
      `Failed to create '${failure.name}': ${failure.error}.\n\nPlease recreate the dashboard from scratch rather than attempting to modify. This error could be due to:\n- Invalid metric UUIDs (please check that the metrics exist)\n- Invalid configuration in the dashboard file\n- Row configuration errors (column sizes must sum to 12)\n- Special characters in the dashboard name or description`
  );

  if (failures.length === 1) {
    return `${successMsg.trim()}${failures[0]}.`;
  }

  return `${successMsg}Failed to create ${failures.length} dashboard files:\n${failures.join('\n')}`;
}

// Export the tool with complete schema included
export const createDashboardsFileTool = createTool({
  id: 'create-dashboards-file',
  description: `Creates dashboard configuration files with YAML content following the dashboard schema specification. Before using this tool, carefully consider the dashboard layout, metric references, and row organization. Each dashboard references existing metrics by their UUIDs and organizes them into rows with specific column layouts. **This tool supports creating multiple dashboards in a single call; prefer using bulk creation over creating dashboards one by one.**

## COMPLETE DASHBOARD YAML SCHEMA

${`# DASHBOARD CONFIGURATION - YML STRUCTURE
# ----------------------------------------
# Required fields:
#
# name: Your Dashboard Title  # Do NOT use quotes for string values
# description: A description of the dashboard, its metrics, and its purpose.  # NO quotes
# rows: 
#   - id: 1               # Required row ID (integer)
#     items:
#       - id: metric-uuid-1  # UUIDv4 of an existing metric, NO quotes
#     columnSizes: [12]   # Required - must sum to exactly 12
#   - id: 2 # REQUIRED
#     items:
#       - id: metric-uuid-2
#       - id: metric-uuid-3
#     columnSizes: 
#       - 6
#       - 6
#
# Rules:
# 1. Each row can have up to 4 items
# 2. Each row must have a unique ID
# 3. columnSizes is required and must specify the width for each item
# 4. Sum of columnSizes in a row must be exactly 12
# 5. Each column size must be at least 3
# 6. All arrays should follow the YML array syntax using \`-\` and should NOT USE \`[]\` formatting.
# 7. Don't use comments. The ones in the example are just for explanation
# 8. String values generally should NOT use quotes unless they contain special characters (like :, {, }, [, ], ,, &, *, #, ?, |, -, <, >, =, !, %, @, \`) or start/end with whitespace.
# 9. If a string contains special characters or needs to preserve leading/trailing whitespace, enclose it in double quotes (\`"\`). Example: \`name: "Sales & Marketing Dashboard"\`
# 10. Avoid special characters in names and descriptions where possible, but if needed, use quotes as described in rule 9. UUIDs should NEVER be quoted.
# ----------------------------------------

type: object
name: Dashboard Configuration Schema
description: Specifies the structure and constraints of a dashboard config file.
properties:
  name:
    type: string
    description: The title of the dashboard (e.g. Sales & Marketing Dashboard) - do NOT use quotes
  description:
    type: string
    description: A description of the dashboard, its metrics, and its purpose
  rows:
    type: array
    description: Array of row objects, each containing metric items
    items:
      type: object
      properties:
        id:
          type: integer
          description: This is just an integer representing the row number 1 -> n
        items:
          type: array
          description: Array of metrics to display in this row (max 4 items)
          maxItems: 4
          items:
            type: object
            properties:
              id:
                type: string
                description: UUIDv4 identifier of an existing metric
            required:
              - id
        columnSizes:
          type: array
          description: Required array of column sizes (must sum to exactly 12)
          items:
            type: integer
            minimum: 3
            maximum: 12
      required:
        - id
        - items
        - columnSizes
required:
  - name
  - description
  - rows`}

**Key Requirements:**
- \`name\`: Dashboard title (no underscores, descriptive name)
- \`description\`: Natural language explanation of the dashboard's purpose and contents
- \`rows\`: Array of row objects, each with unique ID, items (metric UUIDs), and columnSizes
- Each row must have 1-4 items maximum
- \`columnSizes\` must sum to exactly 12 and each size must be >= 3
- All metric IDs must be valid UUIDs of existing metrics
- Row IDs must be unique integers (typically 1, 2, 3, etc.)

**Dashboard Layout Rules:**
- Grid system: Each row spans 12 columns total
- Column sizes: [12] = full width, [6,6] = two halves, [4,4,4] = three thirds, [3,3,3,3] = four quarters
- Common layouts: [12], [6,6], [4,8], [3,9], [4,4,4], [3,3,6], [3,3,3,3]
- Each metric item gets the corresponding column size in the same position

**Example Structure:**
\`\`\`yaml
name: Sales Performance Dashboard
description: Comprehensive overview of sales metrics including revenue, conversions, and geographic performance
rows:
  - id: 1
    items:
      - id: 550e8400-e29b-41d4-a716-446655440001
    columnSizes:
      - 12
  - id: 2
    items:
      - id: 550e8400-e29b-41d4-a716-446655440002
      - id: 550e8400-e29b-41d4-a716-446655440003
    columnSizes:
      - 6
      - 6
  - id: 3
    items:
      - id: 550e8400-e29b-41d4-a716-446655440004
      - id: 550e8400-e29b-41d4-a716-446655440005
      - id: 550e8400-e29b-41d4-a716-446655440006
    columnSizes:
      - 4
      - 4
      - 4
\`\`\`

**CRITICAL:** Follow the schema exactly - all metric IDs must reference existing metrics, column sizes must sum to 12, and row IDs must be unique. The tool will validate all metric references against the database.`,
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
              "The YAML content for a single dashboard, adhering to the comprehensive dashboard schema. Multiple dashboards can be created in one call by providing multiple entries in the 'files' array. **Prefer creating dashboards in bulk.**"
            ),
        })
      )
      .min(1)
      .describe(
        'List of dashboard file parameters to create. The files will contain YAML content that adheres to the dashboard schema specification.'
      ),
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
  }),
  execute: async ({ context, runtimeContext }) => {
    return await createDashboardFiles(context as CreateDashboardFilesParams, runtimeContext);
  },
});

export default createDashboardsFileTool;
