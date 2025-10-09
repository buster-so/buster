import path from 'node:path';
import { wrapTraced } from 'braintrust';
import type {
  WriteFileToolContext,
  WriteFileToolInput,
  WriteFileToolOutput,
} from './write-file-tool';

/**
 * Validates that a file path is safe and within the project directory
 * @param filePath - The file path to validate
 * @param projectDirectory - The root directory of the project
 * @throws Error if the path is unsafe or outside the project
 */
function validateFilePath(filePath: string, projectDirectory: string): void {
  // Convert to absolute path if relative
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(projectDirectory, filePath);

  // Normalize to resolve any '..' or '.' components
  const normalizedPath = path.normalize(absolutePath);
  const normalizedProject = path.normalize(projectDirectory);

  // Ensure the resolved path is within the project directory
  if (!normalizedPath.startsWith(normalizedProject)) {
    throw new Error(`File ${filePath} is not in the current working directory ${projectDirectory}`);
  }
}

/**
 * Creates a single file using Bun's filesystem API
 * @param filePath - The file path to create (absolute or relative)
 * @param content - The content to write
 * @param projectDirectory - The root directory of the project
 * @returns Result object with success status and details
 */
async function createSingleFile(
  filePath: string,
  content: string,
  projectDirectory: string
): Promise<{
  status: 'success' | 'error';
  filePath: string;
  errorMessage?: string;
  existed?: boolean;
}> {
  try {
    // Convert to absolute path if relative
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(projectDirectory, filePath);

    // Validate the file path is within the project directory
    validateFilePath(absolutePath, projectDirectory);

    // Check if file already exists
    const file = Bun.file(absolutePath);
    const existed = await file.exists();

    if (existed) {
      console.info(`Overwriting existing file: ${absolutePath}`);
    } else {
      console.info(`Creating new file: ${absolutePath}`);
    }

    // Write the file content (Bun automatically creates parent directories)
    await Bun.write(absolutePath, content);

    console.info(`Successfully ${existed ? 'updated' : 'created'} file: ${absolutePath}`);

    return {
      status: 'success',
      filePath: absolutePath,
      existed,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error creating file ${filePath}:`, errorMessage);

    return {
      status: 'error',
      filePath,
      errorMessage,
    };
  }
}

/**
 * Creates the execute function for the create files tool
 * @param context - The tool context containing messageId and project directory
 * @returns The execute function
 */
export function createWriteFileToolExecute(context: WriteFileToolContext) {
  return wrapTraced(
    async function execute(input: WriteFileToolInput): Promise<WriteFileToolOutput> {
      const { messageId, projectDirectory, onToolEvent } = context;
      const { files } = input;

      console.info(`Creating ${files.length} file(s) for message ${messageId}`);

      // Emit start event
      onToolEvent?.({
        tool: 'writeFileTool',
        event: 'start',
        args: input,
      });

      // Process all files in parallel
      const fileResults = await Promise.all(
        files.map((file) => createSingleFile(file.path, file.content, projectDirectory))
      );

      // Format results according to the output schema
      const results = fileResults.map((result) => {
        if (result.status === 'success') {
          return {
            status: 'success' as const,
            filePath: result.filePath,
          };
        }

        return {
          status: 'error' as const,
          filePath: result.filePath,
          errorMessage: result.errorMessage || 'Unknown error occurred',
        };
      });

      // Log summary
      const successCount = results.filter((r) => r.status === 'success').length;
      const errorCount = results.filter((r) => r.status === 'error').length;

      console.info(`File creation complete: ${successCount} succeeded, ${errorCount} failed`);

      if (errorCount > 0) {
        const errors = results.filter((r) => r.status === 'error');
        console.error('Failed files:', errors);
      }

      const output = { results };

      // Emit complete event
      onToolEvent?.({
        tool: 'writeFileTool',
        event: 'complete',
        result: output,
        args: input,
      });

      return output;
    },
    { name: 'write-file-execute' }
  );
}
