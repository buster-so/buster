import { runTypescript } from '@buster/sandbox';
import { wrapTraced } from 'braintrust';
import type {
  EditFilesToolContext,
  EditFilesToolInput,
  EditFilesToolOutput,
} from './edit-files-tool';

export function createEditFilesToolExecute(context: EditFilesToolContext) {
  return wrapTraced(
    async (input: EditFilesToolInput): Promise<EditFilesToolOutput> => {
      const { edits } = input;

      if (!edits || edits.length === 0) {
        return {
          results: [],
          summary: { total: 0, successful: 0, failed: 0 },
        };
      }

      try {
        const sandbox = context.sandbox;

        if (!sandbox) {
          // When not in sandbox, we can't edit files - return error for each edit
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
        }

        // Generate CommonJS code for sandbox execution
        const sandboxCode = `
const fs = require('fs');
const path = require('path');

const edits = ${JSON.stringify(edits)};  // Direct stringify, no double encoding
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
      if (error.code === 'ENOENT') {
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

        const successful = fileResults.filter((r) => r.success).length;
        const failed = fileResults.length - successful;

        const output = {
          results: fileResults.map((fileResult) => {
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
          }),
          summary: {
            total: fileResults.length,
            successful,
            failed,
          },
        };

        return output;
      } catch (error) {
        const errorMessage = `Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        const output = {
          results: edits.map((edit) => ({
            status: 'error' as const,
            file_path: edit.filePath,
            error_message: errorMessage,
          })),
          summary: {
            total: edits.length,
            successful: 0,
            failed: edits.length,
          },
        };

        return output;
      }
    },
    { name: 'edit-files-tool-execute' }
  );
}
