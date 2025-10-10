import path from 'node:path';
import { wrapTraced } from 'braintrust';
import { createTwoFilesPatch } from 'diff';
import { replace } from '../edit-file-tool/edit-file-tool-execute';
import type {
  MultiEditFileToolContext,
  MultiEditFileToolInput,
  MultiEditFileToolOutput,
} from './multi-edit-file-tool';

/**
 * Validates that a file path is safe and within the project directory
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

function trimDiff(diff: string): string {
  const lines = diff.split('\n');
  const contentLines = lines.filter(
    (line) =>
      (line.startsWith('+') || line.startsWith('-') || line.startsWith(' ')) &&
      !line.startsWith('---') &&
      !line.startsWith('+++')
  );

  if (contentLines.length === 0) return diff;

  let min = Number.POSITIVE_INFINITY;
  for (const line of contentLines) {
    const content = line.slice(1);
    if (content.trim().length > 0) {
      const match = content.match(/^(\s*)/);
      if (match?.[1]) min = Math.min(min, match[1].length);
    }
  }
  if (min === Number.POSITIVE_INFINITY || min === 0) return diff;
  const trimmedLines = lines.map((line) => {
    if (
      (line.startsWith('+') || line.startsWith('-') || line.startsWith(' ')) &&
      !line.startsWith('---') &&
      !line.startsWith('+++')
    ) {
      const prefix = line[0];
      const content = line.slice(1);
      return prefix + content.slice(min);
    }
    return line;
  });

  return trimmedLines.join('\n');
}

/**
 * Creates the execute function for the multi-edit file tool
 */
export function createMultiEditFileToolExecute(context: MultiEditFileToolContext) {
  return wrapTraced(
    async function execute(input: MultiEditFileToolInput): Promise<MultiEditFileToolOutput> {
      const { messageId, projectDirectory, onToolEvent } = context;
      const { filePath, edits } = input;

      console.info(`Applying ${edits.length} edit(s) to ${filePath} for message ${messageId}`);

      // Emit start event
      onToolEvent?.({
        tool: 'editFileTool',
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

        // Check if file exists and read original content
        const file = Bun.file(absolutePath);
        const stats = await file.stat().catch(() => {});

        let contentOriginal = '';
        let isNewFile = false;

        if (!stats) {
          // File doesn't exist - we'll create it with the first edit
          console.info(`File does not exist, will be created: ${absolutePath}`);
          isNewFile = true;
        } else if (stats.isDirectory()) {
          return {
            success: false,
            filePath: absolutePath,
            editResults: [],
            errorMessage: `Path is a directory, not a file: ${filePath}`,
          };
        } else {
          contentOriginal = await file.text();
        }

        // Track results for each edit
        const editResults: Array<{
          editNumber: number;
          success: boolean;
          message?: string;
          errorMessage?: string;
        }> = [];

        let currentContent = contentOriginal;
        let allSucceeded = true;

        // Apply each edit sequentially
        for (let i = 0; i < edits.length; i++) {
          const edit = edits[i];
          if (!edit) continue;

          try {
            // For new file creation with first edit, allow empty oldString
            if (isNewFile && i === 0 && edit.oldString === '') {
              currentContent = edit.newString;
              editResults.push({
                editNumber: i + 1,
                success: true,
                message: `Created new file with initial content`,
              });
              continue;
            }

            // Apply the replacement
            const newContent = replace(
              currentContent,
              edit.oldString,
              edit.newString,
              edit.replaceAll
            );

            currentContent = newContent;
            editResults.push({
              editNumber: i + 1,
              success: true,
              message: `Successfully replaced "${edit.oldString.substring(0, 50)}${edit.oldString.length > 50 ? '...' : ''}" with "${edit.newString.substring(0, 50)}${edit.newString.length > 50 ? '...' : ''}"`,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Edit ${i + 1} failed:`, errorMessage);

            editResults.push({
              editNumber: i + 1,
              success: false,
              errorMessage,
            });

            allSucceeded = false;
            break; // Stop on first failure
          }
        }

        // If any edit failed, don't write the changes (atomic operation)
        if (!allSucceeded) {
          const failedEdit = editResults.find((r) => !r.success);
          return {
            success: false,
            filePath: absolutePath,
            editResults,
            errorMessage: `Edit ${failedEdit?.editNumber} failed: ${failedEdit?.errorMessage}. No changes were applied.`,
          };
        }

        // All edits succeeded - write the file
        await Bun.write(absolutePath, currentContent);

        // Generate final diff
        const finalDiff = trimDiff(
          createTwoFilesPatch(filePath, filePath, contentOriginal, currentContent)
        );

        console.info(`Successfully applied all ${edits.length} edit(s) to ${absolutePath}`);

        const output = {
          success: true,
          filePath: absolutePath,
          editResults,
          finalDiff,
          message: `Successfully applied ${edits.length} edit(s) to ${filePath}`,
        };

        // Emit complete event
        onToolEvent?.({
          tool: 'editFileTool',
          event: 'complete',
          result: output,
          args: input,
        });

        return output;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error during multi-edit operation on ${filePath}:`, errorMessage);

        const output = {
          success: false,
          filePath,
          editResults: [],
          errorMessage,
        };

        // Emit complete event even on error
        onToolEvent?.({
          tool: 'editFileTool',
          event: 'complete',
          result: output,
          args: input,
        });

        return output;
      }
    },
    { name: 'multi-edit-file-execute' }
  );
}
