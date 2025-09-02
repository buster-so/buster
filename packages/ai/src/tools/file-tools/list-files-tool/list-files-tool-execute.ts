import { wrapTraced } from 'braintrust';
import type {
  ListFilesToolContext,
  ListFilesToolInput,
  ListFilesToolOutput,
} from './list-files-tool';

export function createListFilesToolExecute(context: ListFilesToolContext) {
  return wrapTraced(
    async (input: ListFilesToolInput): Promise<ListFilesToolOutput> => {
      const { paths, options } = input;

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
              error_message: 'tree command requires sandbox environment',
            })),
          };
        }

        const results = [];

        for (const targetPath of paths) {
          try {
            const flags = ['--gitignore'];

            if (options?.depth) {
              flags.push('-L', options.depth.toString());
            }
            if (options?.all) {
              flags.push('-a');
            }
            if (options?.dirsOnly) {
              flags.push('-d');
            }
            if (options?.followSymlinks) {
              flags.push('-l');
            }
            if (options?.ignorePattern) {
              flags.push('-I', options.ignorePattern);
            }

            const command = `tree ${flags.join(' ')} "${targetPath}"`;
            const result = await sandbox.process.executeCommand(command);

            if (result.exitCode === 0 && !result.result.includes('[error opening dir]')) {
              const pwdResult = await sandbox.process.executeCommand('pwd');

              results.push({
                status: 'success' as const,
                path: targetPath,
                output: result.result,
                currentDirectory: pwdResult.result.trim(),
              });
            } else {
              results.push({
                status: 'error' as const,
                path: targetPath,
                error_message: result.result || `Command failed with exit code ${result.exitCode}`,
              });
            }
          } catch (error) {
            results.push({
              status: 'error' as const,
              path: targetPath,
              error_message: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        return { results };
      } catch (error) {
        const errorMessage = `Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        const output = {
          results: paths.map((targetPath) => ({
            status: 'error' as const,
            path: targetPath,
            error_message: errorMessage,
          })),
        };

        return output;
      }
    },
    { name: 'list-files-tool-execute' }
  );
}
