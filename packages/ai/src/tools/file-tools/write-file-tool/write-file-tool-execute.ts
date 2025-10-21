import { existsSync, realpathSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
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
  // Check for invalid characters in the path
  if (filePath.includes('\n') || filePath.includes('\r')) {
    throw new Error(
      `Invalid file path: path must not contain newline characters. Received path with newlines: "${filePath.substring(0, 100)}..."`
    );
  }

  // Check for suspicious patterns that suggest context was included in path
  if (filePath.includes('Working Directory:') || filePath.includes('Directory Structure:')) {
    throw new Error(
      `Invalid file path: path appears to contain context information rather than a valid file path. Path should be a simple file path like "folder/file.txt" or "/absolute/path/file.txt"`
    );
  }

  // Convert to absolute path if relative
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(projectDirectory, filePath);

  // Normalize to resolve any '..' or '.' components
  const normalizedPath = path.normalize(absolutePath);

  // Resolve symlinks in the project directory (e.g., /var -> /private/var on macOS)
  let normalizedProject: string;
  try {
    normalizedProject = realpathSync(projectDirectory);
  } catch {
    // If realpathSync fails, fall back to normalize
    normalizedProject = path.normalize(projectDirectory);
  }

  // Also resolve the parent directory of the file path to handle symlinks
  const fileDir = path.dirname(normalizedPath);
  let resolvedFileDir: string = fileDir;
  try {
    // Try to resolve the directory (it might not exist yet)
    resolvedFileDir = realpathSync(fileDir);
  } catch {
    // If it doesn't exist, resolve what we can
    let current = fileDir;
    let foundResolution = false;
    while (current !== path.dirname(current)) {
      try {
        const resolvedCurrent = realpathSync(current);
        // Successfully resolved a parent, prepend the rest
        const remainder = path.relative(current, fileDir);
        resolvedFileDir = path.join(resolvedCurrent, remainder);
        foundResolution = true;
        break;
      } catch {
        current = path.dirname(current);
      }
    }
    if (!foundResolution) {
      resolvedFileDir = path.normalize(fileDir);
    }
  }

  const resolvedPath = path.join(resolvedFileDir, path.basename(normalizedPath));

  // Ensure the resolved path is within the project directory
  if (!resolvedPath.startsWith(normalizedProject)) {
    throw new Error(`File ${filePath} is not in the current working directory ${projectDirectory}`);
  }
}

/**
 * Creates a single file using Node.js filesystem API (works in both Node and Bun)
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
    const existed = existsSync(absolutePath);

    if (existed) {
      console.info(`Overwriting existing file: ${absolutePath}`);
    } else {
      console.info(`Creating new file: ${absolutePath}`);
    }

    // Create parent directories if they don't exist
    const dir = path.dirname(absolutePath);
    await mkdir(dir, { recursive: true });

    // Write the file content
    await writeFile(absolutePath, content, 'utf8');

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
      const { messageId, onToolEvent } = context;
      const { files } = input;
      const projectDirectory = process.cwd();

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
