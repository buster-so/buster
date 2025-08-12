import { appendReportContent, replaceReportContent } from '@buster/database';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import type { AnalystRuntimeContext } from '../../workflows/analyst-workflow';
import { trackFileAssociations } from './file-tracking-helper';

// Core interfaces
interface EditOperation {
  code_to_replace: string;
  code: string;
}

interface EditReportsParams {
  id: string;
  name: string;
  edits: EditOperation[];
}

interface EditReportsOutput {
  success: boolean;
  message: string;
  duration: number;
  file: {
    id: string;
    name: string;
    content: string;
    version_number: number;
    updated_at: string;
  };
  error?: string;
}

// Process a single edit operation
async function processEditOperation(
  reportId: string,
  edit: EditOperation,
  _currentContent: string
): Promise<{
  success: boolean;
  content?: string;
  error?: string;
}> {
  try {
    if (edit.code_to_replace === '') {
      // Append mode
      const result = await appendReportContent({
        reportId,
        content: edit.code,
      });
      return {
        success: true,
        content: result.content,
      };
    }
    // Replace mode
    const result = await replaceReportContent({
      reportId,
      findString: edit.code_to_replace,
      replaceString: edit.code,
    });
    return {
      success: true,
      content: result.content,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Edit operation failed',
    };
  }
}

// Process all edit operations sequentially
async function processEditOperations(
  reportId: string,
  edits: EditOperation[]
): Promise<{
  success: boolean;
  finalContent?: string;
  errors: string[];
}> {
  let currentContent = '';
  const errors: string[] = [];
  let allSuccess = true;

  for (const [index, edit] of edits.entries()) {
    const result = await processEditOperation(reportId, edit, currentContent);

    if (result.success && result.content) {
      currentContent = result.content;
    } else {
      allSuccess = false;
      const operation = edit.code_to_replace === '' ? 'append' : 'replace';
      errors.push(`Edit ${index + 1} (${operation}): ${result.error || 'Unknown error'}`);
      // Continue processing remaining edits even if one fails
    }
  }

  const returnValue: {
    success: boolean;
    finalContent?: string;
    errors: string[];
  } = {
    success: allSuccess,
    errors,
  };

  if (currentContent !== '') {
    returnValue.finalContent = currentContent;
  }

  return returnValue;
}

// Main edit reports function
const editReportsFile = wrapTraced(
  async (
    params: EditReportsParams,
    runtimeContext: RuntimeContext<AnalystRuntimeContext>
  ): Promise<EditReportsOutput> => {
    const startTime = Date.now();

    // Get runtime context values
    const userId = runtimeContext?.get('userId') as string;
    const organizationId = runtimeContext?.get('organizationId') as string;
    const messageId = runtimeContext?.get('messageId') as string | undefined;

    if (!userId) {
      return {
        success: false,
        message: 'Unable to verify your identity. Please log in again.',
        duration: Date.now() - startTime,
        file: {
          id: params.id,
          name: params.name,
          content: '',
          version_number: 0,
          updated_at: new Date().toISOString(),
        },
        error: 'User authentication required',
      };
    }

    if (!organizationId) {
      return {
        success: false,
        message: 'Unable to access your organization. Please check your permissions.',
        duration: Date.now() - startTime,
        file: {
          id: params.id,
          name: params.name,
          content: '',
          version_number: 0,
          updated_at: new Date().toISOString(),
        },
        error: 'Organization access required',
      };
    }

    // Validate report ID
    if (!params.id) {
      return {
        success: false,
        message: 'Report ID is required for editing.',
        duration: Date.now() - startTime,
        file: {
          id: '',
          name: params.name,
          content: '',
          version_number: 0,
          updated_at: new Date().toISOString(),
        },
        error: 'Missing report ID',
      };
    }

    // Process all edit operations
    const editResult = await processEditOperations(params.id, params.edits);

    // Track file associations if messageId is available
    if (messageId && editResult.success && editResult.finalContent) {
      await trackFileAssociations({
        messageId,
        files: [
          {
            id: params.id,
            version: 2, // Increment version for edits
          },
        ],
      });
    }

    const duration = Date.now() - startTime;
    const now = new Date().toISOString();

    if (editResult.success && editResult.finalContent) {
      return {
        success: true,
        message: `Successfully applied ${params.edits.length} edit(s) to report: ${params.name}`,
        duration,
        file: {
          id: params.id,
          name: params.name,
          content: editResult.finalContent,
          version_number: 2, // Version is incremented by database
          updated_at: now,
        },
      };
    }
    if (editResult.finalContent) {
      // Partial success
      return {
        success: false,
        message: `Partially applied edits to report: ${params.name}. Some operations failed.`,
        duration,
        file: {
          id: params.id,
          name: params.name,
          content: editResult.finalContent,
          version_number: 2,
          updated_at: now,
        },
        error: editResult.errors.join('; '),
      };
    }
    // Complete failure
    return {
      success: false,
      message: `Failed to edit report: ${params.name}`,
      duration,
      file: {
        id: params.id,
        name: params.name,
        content: '',
        version_number: 0,
        updated_at: now,
      },
      error: editResult.errors.join('; ') || 'All edit operations failed',
    };
  },
  { name: 'edit-reports-file' }
);

// Export the tool with complete schema
export const editReports = createTool({
  id: 'edit-reports-file',
  description: `
  Edit an existing report with find/replace operations or appends during the same creation flow before using \`done\`.

  ## Usage Restrictions
  - Do NOT use this tool for any follow-up after a report has been completed with \`done\`. After \`done\`, it is impossible to edit the completed report.
  - For ANY follow-up request (including small text changes, filter tweaks, or time-range adjustments), you MUST create a new derived report with \`createReports\` instead of editing the original.
  - Use this tool only for minor, immediate iterations before \`done\` within the same creation flow.
  
## How Edits Work

This tool applies a series of edit operations to a report sequentially:

1. **Replace Mode** (when code_to_replace is provided):
   - Finds the exact text specified in code_to_replace
   - Replaces it with the text in code
   - The operation will fail if the text to replace is not found

2. **Append Mode** (when code_to_replace is empty):
   - Appends the text in code to the end of the report
   - Useful for adding new sections or content

## Best Practices

- Edits are applied in order, so later edits see the results of earlier ones
- Use specific, unique text for code_to_replace to avoid unintended replacements
- For large changes, consider using multiple smaller, targeted edits
- Always verify the report ID before attempting edits

## Example Usage

\`\`\`json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Q4 2024 Sales Report",
  "edits": [
    {
      "code_to_replace": "## Preliminary Results",
      "code": "## Final Results"
    },
    {
      "code_to_replace": "",
      "code": "\\n\\n## Addendum\\nAdditional analysis completed on..."
    }
  ]
}
\`\`\``,
  inputSchema: z.object({
    id: z
      .string()
      .uuid()
      .describe('The UUID of the report to edit. Must be an existing report ID.'),
    name: z.string().describe('The name of the report (for reference and tracking purposes)'),
    edits: z
      .array(
        z.object({
          code_to_replace: z
            .string()
            .describe(
              'Markdown content to find and replace. If empty string, the code will be appended to the report.'
            ),
          code: z
            .string()
            .describe(
              'The new markdown content to insert. Either replaces code_to_replace or appends to the end.'
            ),
        })
      )
      .min(1)
      .describe('Array of edit operations to apply sequentially to the report'),
  }),
  outputSchema: z.object({
    success: z.boolean().describe('Whether all edits were successfully applied'),
    message: z.string().describe('Human-readable result message'),
    duration: z.number().describe('Operation duration in milliseconds'),
    file: z.object({
      id: z.string().describe('The report ID'),
      name: z.string().describe('The report name'),
      content: z.string().describe('The updated report content after all edits'),
      version_number: z.number().describe('The new version number after edits'),
      updated_at: z.string().describe('ISO timestamp of the update'),
    }),
    error: z.string().optional().describe('Error details if any operations failed'),
  }),
  execute: async ({ context, runtimeContext }) => {
    return await editReportsFile(
      context as EditReportsParams,
      runtimeContext as RuntimeContext<AnalystRuntimeContext>
    );
  },
});

export default editReports;
