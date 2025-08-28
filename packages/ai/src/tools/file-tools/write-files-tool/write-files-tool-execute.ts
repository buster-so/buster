import { runTypescript } from '@buster/sandbox';
import { wrapTraced } from 'braintrust';
import type {
  WriteFilesToolContext,
  WriteFilesToolInput,
  WriteFilesToolOutput,
} from './write-files-tool';

export function createWriteFilesToolExecute(context: WriteFilesToolContext) {
  return wrapTraced(
    async (input: WriteFilesToolInput): Promise<WriteFilesToolOutput> => {
      const { files } = input;

      if (!files || files.length === 0) {
        return { results: [] };
      }

      try {
        const sandbox = context.sandbox;

        if (!sandbox) {
          return {
            results: files.map((file) => ({
              status: 'error' as const,
              filePath: file.path,
              errorMessage: 'File writing requires sandbox environment',
            })),
          };
        }

        // Generate CommonJS code for sandbox execution
        const sandboxCode = `
const fs = require('fs');
const path = require('path');

const files = ${JSON.stringify(files)};  // Direct stringify, no double encoding
const results = [];
const createdDirs = new Set();

// Process files sequentially
for (const file of files) {
  try {
    const resolvedPath = path.isAbsolute(file.path) 
      ? file.path 
      : path.join(process.cwd(), file.path);
    const dirPath = path.dirname(resolvedPath);

    // Check if file exists and handle overwrite logic
    const fileExists = fs.existsSync(resolvedPath);
    const overwrite = file.overwrite || false;
    if (fileExists && !overwrite) {
      results.push({
        success: false,
        filePath: file.path,
        error: 'File already exists and overwrite is set to false'
      });
      continue;
    }

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
          // Extract only the last line which should be our JSON output
          const lines = result.result.trim().split('\n');
          const jsonLine = lines[lines.length - 1] || '';
          fileResults = JSON.parse(jsonLine);

          // Additional validation
          if (!Array.isArray(fileResults)) {
            console.error('Parsed result is not an array:', fileResults);
            throw new Error('Parsed result is not an array');
          }
        } catch (parseError) {
          console.error('Failed to parse sandbox output:', result.result);
          // Try parsing the entire result as a fallback
          try {
            fileResults = JSON.parse(result.result.trim());
            if (!Array.isArray(fileResults)) {
              throw new Error('Parsed result is not an array');
            }
          } catch (_fallbackError) {
            throw new Error(
              `Failed to parse sandbox output: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`
            );
          }
        }

        // Create checkpoint commit for successfully written files
        const successfulFiles = fileResults.filter((r) => r.success);
        if (successfulFiles.length > 0) {
          try {
            // Create checkpoint commit message
            const commitMessage =
              successfulFiles.length === 1
                ? `docs: write ${successfulFiles[0]?.filePath || 'file'}`
                : `docs: write ${successfulFiles.length} files`;

            // Commit all changes and push to remote
            await sandbox.process.executeCommand(
              `git commit -a -m "${commitMessage}" --no-verify && git push`,
              '/home/daytona/angel-dbt-sample'
            );

            console.info(
              `Created checkpoint commit for ${successfulFiles.length} file(s) and pushed to remote`
            );
          } catch (gitError) {
            // Log but don't fail - files were written successfully
            console.warn(
              'Git operations failed:',
              gitError instanceof Error ? gitError.message : 'Unknown error'
            );
          }
        }

        const output: WriteFilesToolOutput = {
          results: fileResults.map((fileResult) => {
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
          }),
        };

        return output;
      } catch (error) {
        const errorOutput: WriteFilesToolOutput = {
          results: files.map((file) => ({
            status: 'error' as const,
            filePath: file.path,
            errorMessage: `Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          })),
        };

        return errorOutput;
      }
    },
    { name: 'write-files' }
  );
}
