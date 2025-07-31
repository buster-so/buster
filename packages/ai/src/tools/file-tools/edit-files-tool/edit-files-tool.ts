import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { runTypescript } from '@buster/sandbox';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { type DocsAgentContext, DocsAgentContextKeys } from '../../../context/docs-agent-context';
import {
  type GitCommitResult,
  createGitCheckpoint,
  hasSuccessfulOperations,
} from '../shared/git-checkpoint';

const editFileParamsSchema = z.object({
  filePath: z.string().describe('Relative or absolute path to the file'),
  findString: z.string().describe('Text to find (must appear exactly once)'),
  replaceString: z.string().describe('Text to replace the found text with'),
});

const editFilesInputSchema = z.object({
  edits: z
    .array(editFileParamsSchema)
    .min(1, 'At least one edit must be provided')
    .max(100, 'Maximum 100 edits allowed per request')
    .describe(
      'Array of edit operations to perform. Group multiple edits to the same file together for efficiency. Each edit specifies a file path, text to find, and replacement text.'
    ),
  what_i_did: z
    .string()
    .optional()
    .describe(
      'Optional description of changes made. If provided, will create a git commit after successful file operations.'
    ),
});

const editFilesOutputSchema = z.object({
  results: z.array(
    z.discriminatedUnion('status', [
      z.object({
        status: z.literal('success'),
        file_path: z.string(),
        message: z.string(),
      }),
      z.object({
        status: z.literal('error'),
        file_path: z.string(),
        error_message: z.string(),
      }),
    ])
  ),
  summary: z.object({
    total: z.number(),
    successful: z.number(),
    failed: z.number(),
  }),
  gitCommit: z
    .object({
      attempted: z.boolean(),
      success: z.boolean(),
      commitHash: z.string().optional(),
      errorMessage: z.string().optional(),
    })
    .optional(),
});

const editFilesExecution = wrapTraced(
  async (
    params: z.infer<typeof editFilesInputSchema>,
    runtimeContext: RuntimeContext<DocsAgentContext>
  ): Promise<z.infer<typeof editFilesOutputSchema>> => {
    const { edits, what_i_did } = params;

    if (!edits || edits.length === 0) {
      return {
        results: [],
        summary: { total: 0, successful: 0, failed: 0 },
      };
    }

    try {
      const sandbox = runtimeContext.get(DocsAgentContextKeys.Sandbox);

      if (sandbox) {
        // Generate CommonJS code for sandbox execution
        const editsJson = JSON.stringify(edits);
        const sandboxCode = `
const fs = require('fs');
const path = require('path');

const editsJson = ${JSON.stringify(editsJson)};
const edits = JSON.parse(editsJson);
const results = [];

// Process edits
for (const edit of edits) {
  try {
    const resolvedPath = path.isAbsolute(edit.filePath) 
      ? edit.filePath 
      : path.join(process.cwd(), edit.filePath);
      
    // Read the file
    let content;
    try {
      content = fs.readFileSync(resolvedPath, 'utf-8');
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        results.push({
          success: false,
          filePath: edit.filePath,
          error: 'File not found'
        });
        continue;
      }
      throw error;
    }
    
    // Check if find string exists
    const occurrences = content.split(edit.findString).length - 1;
    
    if (occurrences === 0) {
      results.push({
        success: false,
        filePath: edit.filePath,
        error: 'Find string not found in file: "' + edit.findString + '"'
      });
      continue;
    }
    
    if (occurrences > 1) {
      results.push({
        success: false,
        filePath: edit.filePath,
        error: 'Find string "' + edit.findString + '" appears ' + occurrences + ' times. Please use a more specific string that appears only once.'
      });
      continue;
    }
    
    // Replace the string
    const newContent = content.replace(edit.findString, edit.replaceString);
    fs.writeFileSync(resolvedPath, newContent, 'utf-8');
    
    results.push({
      success: true,
      filePath: edit.filePath,
      message: 'Successfully replaced "' + edit.findString + '" with "' + edit.replaceString + '" in ' + edit.filePath
    });
  } catch (error) {
    results.push({
      success: false,
      filePath: edit.filePath,
      error: (error instanceof Error ? error.message : String(error)) || 'Unknown error'
    });
  }
}

console.log(JSON.stringify(results));
`;

        const result = await runTypescript(sandbox, sandboxCode);

        if (result.exitCode !== 0) {
          console.error('Sandbox execution failed. Exit code:', result.exitCode);
          console.error('Stderr:', result.stderr);
          console.error('Result:', result.result);
          throw new Error(`Sandbox execution failed: ${result.stderr || 'Unknown error'}`);
        }

        let fileResults: Array<{
          success: boolean;
          filePath: string;
          message?: string;
          error?: string;
        }>;
        try {
          fileResults = JSON.parse(result.result.trim());
        } catch (parseError) {
          console.error('Failed to parse sandbox output:', result.result);
          throw new Error(
            `Failed to parse sandbox output: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`
          );
        }

        const successful = fileResults.filter((r) => r.success).length;
        const failed = fileResults.length - successful;

        const mappedResults = fileResults.map((fileResult) => {
          if (fileResult.success) {
            return {
              status: 'success' as const,
              file_path: fileResult.filePath,
              message: fileResult.message || 'File edited successfully',
            };
          }
          return {
            status: 'error' as const,
            file_path: fileResult.filePath,
            error_message: fileResult.error || 'Unknown error',
          };
        });

        // Attempt git commit if requested and there were successful operations
        let gitCommitResult: GitCommitResult | undefined;
        if (what_i_did && hasSuccessfulOperations(mappedResults)) {
          gitCommitResult = await createGitCheckpoint(what_i_did, runtimeContext);
        }

        return {
          results: mappedResults,
          summary: {
            total: fileResults.length,
            successful,
            failed,
          },
          ...(gitCommitResult && { gitCommit: gitCommitResult }),
        };
      }

      // When not in sandbox, we can't edit files
      // Return an error for each edit
      return {
        results: edits.map((edit) => ({
          status: 'error' as const,
          file_path: edit.filePath,
          error_message: 'File editing requires sandbox environment',
        })),
        summary: {
          total: edits.length,
          successful: 0,
          failed: edits.length,
        },
      };
    } catch (error) {
      return {
        results: edits.map((edit) => ({
          status: 'error' as const,
          file_path: edit.filePath,
          error_message: `Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })),
        summary: {
          total: edits.length,
          successful: 0,
          failed: edits.length,
        },
      };
    }
  },
  { name: 'edit-files' }
);

export const editFiles = createTool({
  id: 'edit-files',
  description: `Performs multiple find-and-replace operations on files efficiently. This tool is optimized for making multiple edits to the same file in a single operation, reducing overhead and improving performance.

Key features:
- **Batch multiple edits to the same file** - When making multiple changes to a file, include all edits in a single tool call
- **Efficient bulk operations** - Process multiple related edits together (e.g., updating multiple column descriptions, adding multiple relationships)
- **Smart validation** - Each find string must appear exactly once, but you can edit many different strings in one operation
- **Atomic file operations** - All edits to a single file are applied together for consistency

Best practices:
- **Group related edits** - When updating a YAML file, include all dimension updates, measure updates, and relationship updates in one call
- **Think in batches** - Instead of editing one column at a time, prepare all column edits and submit together
- **Use specific find strings** - Include enough context to ensure uniqueness (e.g., include the full YAML block)

Example: When documenting a model with 10 columns, create 10 edit operations in a single tool call rather than 10 separate calls.`,
  inputSchema: editFilesInputSchema,
  outputSchema: editFilesOutputSchema,
  execute: async ({
    context,
    runtimeContext,
  }: {
    context: z.infer<typeof editFilesInputSchema>;
    runtimeContext: RuntimeContext<DocsAgentContext>;
  }) => {
    return await editFilesExecution(context, runtimeContext);
  },
});

export default editFiles;
