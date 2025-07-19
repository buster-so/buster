import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface EditFileParams {
  filePath: string;
  findString: string;
  replaceString: string;
}

export interface EditFileResult {
  success: boolean;
  filePath: string;
  error?: string;
  message?: string;
}

export function editSingleFile(params: EditFileParams): EditFileResult {
  const { filePath, findString, replaceString } = params;

  try {
    const resolvedPath = resolve(filePath);

    if (!existsSync(resolvedPath)) {
      return {
        success: false,
        filePath,
        error: `File not found: ${filePath}`,
      };
    }

    let content: string;
    try {
      content = readFileSync(resolvedPath, 'utf-8');
    } catch (error) {
      return {
        success: false,
        filePath,
        error: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }

    const occurrences = (content.match(new RegExp(escapeRegExp(findString), 'g')) || []).length;

    if (occurrences === 0) {
      return {
        success: false,
        filePath,
        error: `Find string not found in file: "${findString}"`,
      };
    }

    if (occurrences > 1) {
      return {
        success: false,
        filePath,
        error: `Find string appears ${occurrences} times in file. Please use a more specific string that appears exactly once: "${findString}"`,
      };
    }

    const updatedContent = content.replace(new RegExp(escapeRegExp(findString), 'g'), replaceString);

    try {
      writeFileSync(resolvedPath, updatedContent, 'utf-8');
    } catch (error) {
      return {
        success: false,
        filePath,
        error: `Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }

    return {
      success: true,
      filePath,
      message: `Successfully replaced "${findString}" with "${replaceString}" in ${filePath}`,
    };
  } catch (error) {
    return {
      success: false,
      filePath,
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export function editMultipleFiles(edits: EditFileParams[]): EditFileResult[] {
  return edits.map((editParams) => editSingleFile(editParams));
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
