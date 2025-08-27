import { runTypescript } from '@buster/sandbox';
import { wrapTraced } from 'braintrust';
import type {
  DeleteFilesToolContext,
  DeleteFilesToolInput,
  DeleteFilesToolOutput,
} from './delete-files-tool';

export function createDeleteFilesToolExecute(context: DeleteFilesToolContext) {
  return wrapTraced(
    async (input: DeleteFilesToolInput): Promise<DeleteFilesToolOutput> => {
      const { paths } = input;

      if (!paths || paths.length === 0) {
        return { results: [] };
      }

      try {
        const sandbox = context.sandbox;

        if (!sandbox) {
          return {
            results: paths.map((targetPath) => ({
              status: 'error' as const,
              path: targetPath,
              error_message: 'File deletion requires sandbox environment',
            })),
          };
        }

        // Generate CommonJS code for sandbox execution
        const sandboxCode = `
const fs = require('fs');
const path = require('path');

const paths = ${JSON.stringify(paths)};  // Direct stringify, no double encoding
const results = [];

// Process files
for (const filePath of paths) {
  try {
    const resolvedPath = path.isAbsolute(filePath) 
      ? filePath 
      : path.join(process.cwd(), filePath);
    
    // Check if path exists and get stats
    let stats;
    try {
      stats = fs.statSync(resolvedPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        results.push({
          success: false,
          path: filePath,
          error: 'File not found'
        });
        continue;
      }
      throw error;
    }
    
    // Check if it's a directory
    if (stats.isDirectory()) {
      results.push({
        success: false,
        path: filePath,
        error: 'Cannot delete directories with this tool'
      });
      continue;
    }
    
    // Delete the file
    fs.unlinkSync(resolvedPath);
    
    results.push({
      success: true,
      path: filePath
    });
  } catch (error) {
    results.push({
      success: false,
      path: filePath,
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
          path: string;
          error?: string;
        }>;
        try {
          // Extract only the last line which should be our JSON output
          const lines = result.result.trim().split('\n');
          const jsonLine = lines[lines.length - 1] || '';
          fileResults = JSON.parse(jsonLine);
        } catch (parseError) {
          console.error('Failed to parse sandbox output:', result.result);
          // Try parsing the entire result as a fallback
          try {
            fileResults = JSON.parse(result.result.trim());
          } catch (_fallbackError) {
            throw new Error(
              `Failed to parse sandbox output: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`
            );
          }
        }

        const output: DeleteFilesToolOutput = {
          results: fileResults.map((fileResult) => {
            if (fileResult.success) {
              return {
                status: 'success' as const,
                path: fileResult.path,
              };
            }
            return {
              status: 'error' as const,
              path: fileResult.path,
              error_message: fileResult.error || 'Unknown error',
            };
          }),
        };

        return output;
      } catch (error) {
        const errorMessage = `Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        return {
          results: paths.map((targetPath) => ({
            status: 'error' as const,
            path: targetPath,
            error_message: errorMessage,
          })),
        };
      }
    },
    { name: 'delete-files-tool-execute' }
  );
}
