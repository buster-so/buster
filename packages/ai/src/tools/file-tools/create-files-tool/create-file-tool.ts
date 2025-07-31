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

const fileCreateParamsSchema = z.object({
  path: z.string().describe('The relative or absolute path to create the file at'),
  content: z.string().describe('The content to write to the file'),
});

const createFilesInputSchema = z.object({
  files: z.array(fileCreateParamsSchema).describe('Array of file creation operations to perform'),
  what_i_did: z
    .string()
    .optional()
    .describe(
      'Optional description of changes made. If provided, will create a git commit after successful file operations.'
    ),
});

const createFilesOutputSchema = z.object({
  results: z.array(
    z.discriminatedUnion('status', [
      z.object({
        status: z.literal('success'),
        filePath: z.string(),
      }),
      z.object({
        status: z.literal('error'),
        filePath: z.string(),
        errorMessage: z.string(),
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

const createFilesExecution = wrapTraced(
  async (
    params: z.infer<typeof createFilesInputSchema>,
    runtimeContext: RuntimeContext<DocsAgentContext>
  ): Promise<z.infer<typeof createFilesOutputSchema>> => {
    const { files, what_i_did } = params;

    if (!files || files.length === 0) {
      return { results: [] };
    }

    try {
      const sandbox = runtimeContext.get(DocsAgentContextKeys.Sandbox);

      if (sandbox) {
        // Generate CommonJS code for sandbox execution
        const filesJson = JSON.stringify(files);
        const sandboxCode = `
const fs = require('fs');
const path = require('path');

const filesJson = ${JSON.stringify(filesJson)};
const files = JSON.parse(filesJson);
const results = [];
const createdDirs = new Set();

// Process files sequentially
for (const file of files) {
  try {
    const resolvedPath = path.isAbsolute(file.path) 
      ? file.path 
      : path.join(process.cwd(), file.path);
    const dirPath = path.dirname(resolvedPath);

    // Only create directory if we haven't already created it
    if (!createdDirs.has(dirPath)) {
      try {
        fs.mkdirSync(dirPath, { recursive: true });
        createdDirs.add(dirPath);
      } catch (error) {
        results.push({
          success: false,
          filePath: file.path,
          error: 'Failed to create directory: ' + (error instanceof Error ? error.message : String(error))
        });
        continue;
      }
    }

    fs.writeFileSync(resolvedPath, file.content, 'utf-8');
    
    results.push({
      success: true,
      filePath: file.path
    });
  } catch (error) {
    results.push({
      success: false,
      filePath: file.path,
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

        // Debug logging to see what we're getting
        console.info('Raw sandbox result:', result.result);
        console.info('Trimmed result:', result.result.trim());
        console.info('Result type:', typeof result.result);

        let fileResults: Array<{
          success: boolean;
          filePath: string;
          error?: string;
        }>;
        try {
          fileResults = JSON.parse(result.result.trim());

          // Additional validation
          if (!Array.isArray(fileResults)) {
            console.error('Parsed result is not an array:', fileResults);
            throw new Error('Parsed result is not an array');
          }
        } catch (parseError) {
          console.error('Failed to parse sandbox output:', result.result);
          throw new Error(
            `Failed to parse sandbox output: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`
          );
        }

        try {
          const mappedResults = fileResults.map((fileResult) => {
            if (fileResult.success) {
              return {
                status: 'success' as const,
                filePath: fileResult.filePath,
              };
            }
            return {
              status: 'error' as const,
              filePath: fileResult.filePath,
              errorMessage: fileResult.error || 'Unknown error',
            };
          });

          // Attempt git commit if requested and there were successful operations
          let gitCommitResult: GitCommitResult | undefined;
          if (what_i_did && hasSuccessfulOperations(mappedResults)) {
            gitCommitResult = await createGitCheckpoint(what_i_did, runtimeContext);
          }

          return {
            results: mappedResults,
            ...(gitCommitResult && { gitCommit: gitCommitResult }),
          };
        } catch (mapError) {
          console.error('Error mapping fileResults:', fileResults);
          console.error('Map error:', mapError);
          throw new Error(
            `Failed to map results: ${mapError instanceof Error ? mapError.message : 'Unknown error'}`
          );
        }
      }

      // When not in sandbox, we can't create files
      // Return an error for each file
      return {
        results: files.map((file) => ({
          status: 'error' as const,
          filePath: file.path,
          errorMessage: 'File creation requires sandbox environment',
        })),
      };
    } catch (error) {
      return {
        results: files.map((file) => ({
          status: 'error' as const,
          filePath: file.path,
          errorMessage: `Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })),
      };
    }
  },
  { name: 'create-files' }
);

export const createFiles = createTool({
  id: 'create-files',
  description: `Create one or more files at specified paths with provided content. Supports both absolute and relative file paths. Creates directories if they don't exist and overwrites existing files. Handles errors gracefully by continuing to process other files even if some fail. Returns both successful operations and failed operations with detailed error messages.`,
  inputSchema: createFilesInputSchema,
  outputSchema: createFilesOutputSchema,
  execute: async ({
    context,
    runtimeContext,
  }: {
    context: z.infer<typeof createFilesInputSchema>;
    runtimeContext: RuntimeContext<DocsAgentContext>;
  }) => {
    return await createFilesExecution(context, runtimeContext);
  },
});

export default createFiles;
