import { runTypescript } from '@buster/sandbox';
import { wrapTraced } from 'braintrust';
import type {
  ReadFilesToolContext,
  ReadFilesToolInput,
  ReadFilesToolOutput,
} from './read-files-tool';

export function createReadFilesToolExecute(context: ReadFilesToolContext) {
  return wrapTraced(
    async (input: ReadFilesToolInput): Promise<ReadFilesToolOutput> => {
      const { files } = input;

      if (!files || files.length === 0) {
        return { results: [] };
      }

      try {
        const sandbox = context.sandbox;

        if (!sandbox) {
          return {
            results: files.map((filePath) => ({
              status: 'error' as const,
              file_path: filePath,
              error_message: 'File reading requires sandbox environment',
            })),
          };
        }

        // Generate CommonJS code for sandbox execution
        const sandboxCode = `
const fs = require('fs');
const path = require('path');

const files = ${JSON.stringify(files)};  // Direct stringify, no double encoding
const results = [];
const MAX_LINES = 1000;

// Process files
for (const filePath of files) {
  try {
    const resolvedPath = path.isAbsolute(filePath) 
      ? filePath 
      : path.join(process.cwd(), filePath);
      
    const content = fs.readFileSync(resolvedPath, 'utf-8');
    const lines = content.split('\\n');
    const truncated = lines.length > MAX_LINES;
    const truncatedContent = truncated 
      ? lines.slice(0, MAX_LINES).join('\\n')
      : content;
    
    results.push({
      success: true,
      filePath: filePath,
      content: truncatedContent,
      truncated: truncated
    });
  } catch (error) {
    results.push({
      success: false,
      filePath: filePath,
      error: (error as any).code === 'ENOENT' ? 'File not found' : (error instanceof Error ? error.message : String(error))
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
          content?: string;
          truncated?: boolean;
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

        const output: ReadFilesToolOutput = {
          results: fileResults.map((fileResult) => {
            if (fileResult.success) {
              return {
                status: 'success' as const,
                file_path: fileResult.filePath,
                content: fileResult.content || '',
                truncated: fileResult.truncated || false,
              };
            }
            return {
              status: 'error' as const,
              file_path: fileResult.filePath,
              error_message: fileResult.error || 'Unknown error',
            };
          }),
        };

        return output;
      } catch (error) {
        const errorMessage = `Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        const output = {
          results: files.map((filePath) => ({
            status: 'error' as const,
            file_path: filePath,
            error_message: errorMessage,
          })),
        };

        return output;
      }
    },
    { name: 'read-files-tool-execute' }
  );
}
