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

const deleteFilesInputSchema = z.object({
  paths: z
    .array(z.string())
    .describe(
      'Array of file paths to delete. Can be absolute paths (e.g., /path/to/file.txt) or relative paths (e.g., ./relative/file.txt). Only files can be deleted, not directories.'
    ),
  what_i_did: z
    .string()
    .optional()
    .describe(
      'Optional description of changes made. If provided, will create a git commit after successful file operations.'
    ),
});

const deleteFilesOutputSchema = z.object({
  results: z.array(
    z.discriminatedUnion('status', [
      z.object({
        status: z.literal('success'),
        path: z.string(),
      }),
      z.object({
        status: z.literal('error'),
        path: z.string(),
        error_message: z.string(),
      }),
    ])
  ),
  gitCommit: z
    .object({
      attempted: z.boolean(),
      success: z.boolean(),
      commitHash: z.string().optional(),
      errorMessage: z.string().optional(),
    })
    .optional(),
});

const deleteFilesExecution = wrapTraced(
  async (
    params: z.infer<typeof deleteFilesInputSchema>,
    runtimeContext: RuntimeContext<DocsAgentContext>
  ): Promise<z.infer<typeof deleteFilesOutputSchema>> => {
    const { paths, what_i_did } = params;

    if (!paths || paths.length === 0) {
      return { results: [] };
    }

    try {
      const sandbox = runtimeContext.get(DocsAgentContextKeys.Sandbox);

      if (sandbox) {
        const results: Array<
          | { status: 'success'; path: string }
          | { status: 'error'; path: string; error_message: string }
        > = [];

        // Process each file path
        for (const filePath of paths) {
          try {
            // First check if it's a directory
            const testResult = await sandbox.process.codeRun(`
              const fs = require('fs');
              
              try {
                const stats = fs.statSync('${filePath.replace(/'/g, "\\'")}');
                console.log(JSON.stringify({ isDirectory: stats.isDirectory() }));
              } catch (error) {
                console.log(JSON.stringify({ error: error.code || error.message }));
                process.exit(1);
              }
            `);

            if (testResult.exitCode === 0) {
              const testData = JSON.parse(testResult.result.trim());
              if (testData.isDirectory) {
                results.push({
                  status: 'error',
                  path: filePath,
                  error_message: 'Cannot delete directories with this tool',
                });
                continue;
              }
            }

            // Use rm command to delete the file
            const deleteResult = await sandbox.process.codeRun(`
              const { execSync } = require('child_process');
              
              try {
                execSync('rm "${filePath.replace(/"/g, '\\"')}"', { encoding: 'utf8' });
                console.log('SUCCESS');
              } catch (error) {
                console.error('ERROR:', error.message);
                process.exit(1);
              }
            `);

            if (deleteResult.exitCode === 0) {
              results.push({
                status: 'success',
                path: filePath,
              });
            } else {
              const errorMessage = deleteResult.result || 'Unknown error';
              results.push({
                status: 'error',
                path: filePath,
                error_message: errorMessage.includes('No such file')
                  ? 'File not found'
                  : errorMessage,
              });
            }
          } catch (error) {
            results.push({
              status: 'error',
              path: filePath,
              error_message: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        // Attempt git commit if requested and there were successful operations
        let gitCommitResult: GitCommitResult | undefined;
        if (what_i_did && hasSuccessfulOperations(results)) {
          gitCommitResult = await createGitCheckpoint(what_i_did, runtimeContext);
        }

        return {
          results,
          ...(gitCommitResult && { gitCommit: gitCommitResult }),
        };
      }

      // When not in sandbox, we can't delete files
      // Return an error for each path
      return {
        results: paths.map((targetPath) => ({
          status: 'error' as const,
          path: targetPath,
          error_message: 'File deletion requires sandbox environment',
        })),
      };
    } catch (error) {
      return {
        results: paths.map((targetPath) => ({
          status: 'error' as const,
          path: targetPath,
          error_message: `Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })),
      };
    }
  },
  { name: 'delete-files' }
);

export const deleteFiles = createTool({
  id: 'delete-files',
  description: `Deletes files at the specified paths. Accepts both absolute and relative file paths and can handle bulk operations through an array of paths. Only files can be deleted, not directories. Returns structured JSON with deletion results including success status and any error messages. Handles errors gracefully by continuing to process other files even if some fail.`,
  inputSchema: deleteFilesInputSchema,
  outputSchema: deleteFilesOutputSchema,
  execute: async ({
    context,
    runtimeContext,
  }: {
    context: z.infer<typeof deleteFilesInputSchema>;
    runtimeContext: RuntimeContext<DocsAgentContext>;
  }) => {
    return await deleteFilesExecution(context, runtimeContext);
  },
});

export default deleteFiles;
