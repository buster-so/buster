import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { wrapTraced } from 'braintrust';
import type { ReadFileToolContext, ReadFileToolInput, ReadFileToolOutput } from './read-file-tool';

const DEFAULT_LIMIT = 1000;
const MAX_CHARS_PER_LINE = 2000;
const MAX_TOTAL_CHARS = 100000;

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
 * Creates the execute function for the read files tool
 * @param context - The tool context containing messageId and project directory
 * @returns The execute function
 */
export function createReadFileToolExecute(context: ReadFileToolContext) {
  return wrapTraced(
    async function execute(input: ReadFileToolInput): Promise<ReadFileToolOutput> {
      const { messageId, onToolEvent } = context;
      const { filePath, offset = 0, limit = DEFAULT_LIMIT } = input;
      const projectDirectory = process.cwd();

      console.info(
        `Reading file ${filePath} (offset: ${offset}, limit: ${limit}) for message ${messageId}`
      );

      // Emit start event
      onToolEvent?.({
        tool: 'readFileTool',
        event: 'start',
        args: input,
      });

      try {
        // Convert to absolute path if relative
        const absolutePath = path.isAbsolute(filePath)
          ? filePath
          : path.join(projectDirectory, filePath);

        // Validate the file path is within the project directory
        validateFilePath(absolutePath, projectDirectory);

        // Check if file exists
        if (!existsSync(absolutePath)) {
          console.error(`File not found: ${filePath}`);
          return {
            status: 'error',
            file_path: filePath,
            error_message: 'File not found',
          };
        }

        // Read the file content
        const content = readFileSync(absolutePath, 'utf8');
        const lines = content.split('\n');

        // Apply offset and limit
        const totalLines = lines.length;
        const endIndex = Math.min(offset + limit, totalLines);
        const selectedLines = lines.slice(offset, endIndex);
        const lineTruncated = endIndex < totalLines;

        // Truncate individual lines that exceed character limit
        let charTruncated = false;
        const processedLines = selectedLines.map((line) => {
          if (line.length > MAX_CHARS_PER_LINE) {
            charTruncated = true;
            return `${line.slice(0, MAX_CHARS_PER_LINE)}... (line truncated)`;
          }
          return line;
        });

        // Join lines and check total character limit
        let finalContent = processedLines.join('\n');
        if (finalContent.length > MAX_TOTAL_CHARS) {
          charTruncated = true;
          finalContent = `${finalContent.slice(0, MAX_TOTAL_CHARS)}\n... (content truncated due to size limit)`;
        }

        const truncated = lineTruncated || charTruncated;

        console.info(`Successfully read file: ${filePath}${truncated ? ' (truncated)' : ''}`);

        const output = {
          status: 'success' as const,
          file_path: filePath,
          content: finalContent,
          truncated,
          lineTruncated,
          charTruncated,
        };

        // Emit complete event
        onToolEvent?.({
          tool: 'readFileTool',
          event: 'complete',
          result: output,
          args: input,
        });

        return output;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error reading file ${filePath}:`, errorMessage);

        const output = {
          status: 'error' as const,
          file_path: filePath,
          error_message: errorMessage,
        };

        // Emit complete event even on error
        onToolEvent?.({
          tool: 'readFileTool',
          event: 'complete',
          result: output,
          args: input,
        });

        return output;
      }
    },
    { name: 'read-file-execute' }
  );
}
