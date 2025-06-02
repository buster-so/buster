import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { eq, sql, inArray } from 'drizzle-orm';
import { db, dashboardFiles, metricFiles } from '@buster/database';
import * as yaml from 'yaml';

// Core interfaces matching Rust structs
interface FileUpdate {
  id: string;
  yml_content: string;
}

interface UpdateFilesParams {
  files: FileUpdate[];
}

interface FailedFileModification {
  file_name: string;
  error: string;
}

interface ModificationResult {
  file_id: string;
  file_name: string;
  success: boolean;
  error?: string;
  modification_type: string;
  timestamp: string;
  duration: number;
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

interface ModifyFilesOutput {
  message: string;
  duration: number;
  files: FileWithId[];
  failed_files: FailedFileModification[];
}

interface RuntimeContext {
  get(key: string): string | undefined;
}

// Dashboard YAML schema validation with full rules
const dashboardItemSchema = z.object({
  id: z.string().uuid('Must be a valid UUID for an existing metric')
});

const dashboardRowSchema = z.object({
  id: z.number().int().positive('Row ID must be a positive integer'),
  items: z.array(dashboardItemSchema)
    .min(1, 'Each row must have at least 1 item')
    .max(4, 'Each row can have at most 4 items'),
  columnSizes: z.array(z.number().int().min(3, 'Each column size must be at least 3').max(12, 'Each column size cannot exceed 12'))
    .min(1, 'columnSizes array cannot be empty')
    .refine((sizes) => sizes.reduce((sum, size) => sum + size, 0) === 12, {
      message: 'Column sizes must sum to exactly 12'
    })
}).refine((row) => row.items.length === row.columnSizes.length, {
  message: 'Number of items must match number of column sizes'
});

const dashboardYmlSchema = z.object({
  name: z.string().min(1, 'Dashboard name is required'),
  description: z.string().min(1, 'Dashboard description is required'),
  rows: z.array(dashboardRowSchema)
    .min(1, 'Dashboard must have at least one row')
    .refine((rows) => {
      const ids = rows.map(row => row.id);
      const uniqueIds = new Set(ids);
      return ids.length === uniqueIds.size;
    }, {
      message: 'All row IDs must be unique'
    })
});

// Parse and validate dashboard YAML content
function parseAndValidateYaml(ymlContent: string): { success: boolean; error?: string; data?: any } {
  try {
    const parsedYml = yaml.parse(ymlContent);
    const validationResult = dashboardYmlSchema.safeParse(parsedYml);
    
    if (!validationResult.success) {
      return {
        success: false,
        error: `Invalid YAML structure: ${validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      };
    }

    return { success: true, data: validationResult.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'YAML parsing failed'
    };
  }
}

// Validate that all referenced metric IDs exist in the database
async function validateMetricIds(metricIds: string[]): Promise<{ success: boolean; missingIds?: string[]; error?: string }> {
  if (metricIds.length === 0) {
    return { success: true };
  }

  try {
    const existingMetrics = await db
      .select({ id: metricFiles.id })
      .from(metricFiles)
      .where(inArray(metricFiles.id, metricIds))
      .execute();

    const existingIds = existingMetrics.map(m => m.id);
    const missingIds = metricIds.filter(id => !existingIds.includes(id));

    if (missingIds.length > 0) {
      return { success: false, missingIds };
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to validate metric IDs' 
    };
  }
}

// Process a dashboard file update with complete new YAML content
async function processDashboardFileUpdate(
  file: any,
  ymlContent: string,
  duration: number
): Promise<{
  dashboardFile: any;
  dashboardYml: any;
  results: ModificationResult[];
  validationMessage: string;
  validationResults: Record<string, any>[];
}> {
  const results: ModificationResult[] = [];

  // Create and validate new YML object
  const yamlValidation = parseAndValidateYaml(ymlContent);
  if (!yamlValidation.success) {
    const error = `Failed to validate modified YAML: ${yamlValidation.error}`;
    results.push({
      file_id: file.id,
      file_name: file.name,
      success: false,
      error,
      modification_type: 'validation',
      timestamp: new Date().toISOString(),
      duration
    });
    throw new Error(error);
  }

  const newYml = yamlValidation.data;

  // Collect and validate metric IDs from rows
  const metricIds: string[] = newYml.rows
    .flatMap((row: any) => row.items)
    .map((item: any) => item.id);

  if (metricIds.length > 0) {
    const metricValidation = await validateMetricIds(metricIds);
    if (!metricValidation.success) {
      let error: string;
      if (metricValidation.missingIds && metricValidation.missingIds.length > 0) {
        error = `Invalid metric references: ${metricValidation.missingIds.join(', ')}`;
      } else {
        error = `Failed to validate metrics: ${metricValidation.error}`;
      }
      
      results.push({
        file_id: file.id,
        file_name: file.name,
        success: false,
        error,
        modification_type: 'validation',
        timestamp: new Date().toISOString(),
        duration
      });
      throw new Error(error);
    }
  }

  // Update file record
  file.content = newYml;
  file.updatedAt = new Date().toISOString();
  // Also update the file name to match the YAML name
  file.name = newYml.name;

  // Track successful update
  results.push({
    file_id: file.id,
    file_name: file.name,
    success: true,
    error: undefined,
    modification_type: 'content',
    timestamp: new Date().toISOString(),
    duration
  });

  // Return successful result with empty validation results
  // since dashboards don't have SQL to validate like metrics do
  return {
    dashboardFile: file,
    dashboardYml: newYml,
    results,
    validationMessage: 'Dashboard validation successful',
    validationResults: []
  };
}

// Main modify dashboard files function
const modifyDashboardFiles = wrapTraced(
  async (params: UpdateFilesParams & { runtimeContext?: RuntimeContext }): Promise<ModifyFilesOutput> => {
    const startTime = Date.now();

    // Get runtime context values (for logging/tracking)
    const userId = params.runtimeContext?.get('user_id');
    const organizationId = params.runtimeContext?.get('organization_id');

    if (!userId) {
      throw new Error('User ID not found in runtime context');
    }
    if (!organizationId) {
      throw new Error('Organization ID not found in runtime context');
    }

    const files: FileWithId[] = [];
    const failedFiles: FailedFileModification[] = [];
    const updateResults: ModificationResult[] = [];
    
    const dashboardFilesToUpdate: any[] = [];
    const dashboardYmls: any[] = [];

    try {
      // Process each file update
      for (const fileUpdate of params.files) {
        try {
          // Get the dashboard file from database
          const dashboardFile = await db
            .select()
            .from(dashboardFiles)
            .where(eq(dashboardFiles.id, fileUpdate.id))
            .execute();

          if (dashboardFile.length === 0) {
            failedFiles.push({
              file_name: `Dashboard ${fileUpdate.id}`,
              error: 'Dashboard file not found'
            });
            continue;
          }

          const existingFile = dashboardFile[0];
          const duration = Date.now() - startTime;

          // Process the dashboard file update
          const updateResult = await processDashboardFileUpdate(
            { ...existingFile }, // Create a copy to modify
            fileUpdate.yml_content,
            duration
          );

          const { dashboardFile: updatedFile, dashboardYml, results, validationMessage, validationResults } = updateResult;

          // Calculate next version number from existing version history
          const currentVersionHistory = existingFile.versionHistory as any;
          let nextVersion = 1;
          
          if (currentVersionHistory && currentVersionHistory.versions && Array.isArray(currentVersionHistory.versions)) {
            const versions = currentVersionHistory.versions;
            if (versions.length > 0) {
              const latestVersion = versions[versions.length - 1];
              nextVersion = (latestVersion.versionNumber || 0) + 1;
            }
          }

          // Add new version to history
          const newVersionHistory = {
            versions: [
              ...(currentVersionHistory?.versions || []),
              {
                versionNumber: nextVersion,
                content: dashboardYml,
                createdAt: new Date().toISOString()
              }
            ]
          };

          updatedFile.versionHistory = newVersionHistory;

          // Ensure the name field is updated
          updatedFile.name = dashboardYml.name;

          dashboardFilesToUpdate.push(updatedFile);
          dashboardYmls.push(dashboardYml);
          updateResults.push(...results);

        } catch (error) {
          failedFiles.push({
            file_name: `Dashboard ${fileUpdate.id}`,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Update dashboard files in database with version history
      if (dashboardFilesToUpdate.length > 0) {
        for (const file of dashboardFilesToUpdate) {
          await db
            .update(dashboardFiles)
            .set({
              content: file.content,
              updatedAt: file.updatedAt,
              versionHistory: file.versionHistory,
              name: file.name
            })
            .where(eq(dashboardFiles.id, file.id))
            .execute();
        }

        // Add successful files to output
        for (let i = 0; i < dashboardFilesToUpdate.length; i++) {
          const file = dashboardFilesToUpdate[i];
          const dashboardYml = dashboardYmls[i];
          
          // Get the latest version number
          const versionHistory = file.versionHistory as any;
          const latestVersion = versionHistory?.versions?.[versionHistory.versions.length - 1]?.versionNumber || 1;

          files.push({
            id: file.id,
            name: file.name,
            file_type: 'dashboard',
            yml_content: yaml.stringify(dashboardYml),
            result_message: 'Dashboard validation successful',
            results: [],
            created_at: file.createdAt,
            updated_at: file.updatedAt,
            version_number: latestVersion
          });
        }
      }

    } catch (error) {
      return {
        message: `Failed to update dashboard files: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        files: [],
        failed_files: []
      };
    }

    // Generate result message
    const successCount = files.length;
    const failureCount = failedFiles.length;

    let message: string;
    if (successCount > 0 && failureCount === 0) {
      message = `Successfully modified ${successCount} dashboard file${successCount === 1 ? '' : 's'}.`;
    } else if (successCount === 0 && failureCount > 0) {
      message = `Failed to modify ${failureCount} dashboard file${failureCount === 1 ? '' : 's'}.`;
    } else if (successCount > 0 && failureCount > 0) {
      message = `Successfully modified ${successCount} dashboard file${successCount === 1 ? '' : 's'}, ${failureCount} failed.`;
    } else {
      message = 'No dashboard files were processed.';
    }

    return {
      message,
      duration: Date.now() - startTime,
      files,
      failed_files: failedFiles
    };
  },
  { name: 'modify-dashboard-files' }
);

// Input/Output schemas
const inputSchema = z.object({
  files: z.array(z.object({
    id: z.string().uuid('Dashboard ID must be a valid UUID'),
    yml_content: z.string().min(1, 'YAML content cannot be empty')
  })).min(1, 'At least one dashboard file must be provided')
});

const outputSchema = z.object({
  message: z.string(),
  duration: z.number(),
  files: z.array(z.object({
    id: z.string(),
    name: z.string(),
    file_type: z.string(),
    yml_content: z.string(),
    result_message: z.string().optional(),
    results: z.array(z.record(z.any())).optional(),
    created_at: z.string(),
    updated_at: z.string(),
    version_number: z.number()
  })),
  failed_files: z.array(z.object({
    file_name: z.string(),
    error: z.string()
  }))
});

// Export the tool
export const modifyDashboardsFileTool = createTool({
  id: 'modify-dashboards-file',
  description: 'Updates existing dashboard configuration files with new YAML content. Provide the complete YAML content for each dashboard, replacing the entire existing file. This tool is ideal for bulk modifications when you need to update multiple dashboards simultaneously. The system will preserve version history and perform all necessary validations on the new content. For each dashboard, you need its UUID and the complete updated YAML content.',
  inputSchema,
  outputSchema,
  execute: async ({ context }) => {
    return await modifyDashboardFiles(context as UpdateFilesParams & { runtimeContext?: RuntimeContext });
  }
});

export default modifyDashboardsFileTool;