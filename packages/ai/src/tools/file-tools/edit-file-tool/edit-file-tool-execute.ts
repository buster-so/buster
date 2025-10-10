import path from 'node:path';
import { wrapTraced } from 'braintrust';
import { createTwoFilesPatch } from 'diff';
import type { EditFileToolContext, EditFileToolInput, EditFileToolOutput } from './edit-file-tool';

// Similarity thresholds for block anchor fallback matching
const SINGLE_CANDIDATE_SIMILARITY_THRESHOLD = 0.0;
const MULTIPLE_CANDIDATES_SIMILARITY_THRESHOLD = 0.3;

export type Replacer = (content: string, find: string) => Generator<string, void, unknown>;

/**
 * Levenshtein distance algorithm implementation
 */
function levenshtein(a: string, b: string): number {
  // Handle empty strings
  if (a === '' || b === '') {
    return Math.max(a.length, b.length);
  }
  const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const rowI = matrix[i];
      const rowIPrev = matrix[i - 1];
      if (!rowI || !rowIPrev) continue;
      rowI[j] = Math.min(
        (rowIPrev[j] ?? 0) + 1,
        (rowI[j - 1] ?? 0) + 1,
        (rowIPrev[j - 1] ?? 0) + cost
      );
    }
  }
  const lastRow = matrix[a.length];
  return lastRow?.[b.length] ?? 0;
}

export const SimpleReplacer: Replacer = function* (_content, find) {
  yield find;
};

export const LineTrimmedReplacer: Replacer = function* (content, find) {
  const originalLines = content.split('\n');
  const searchLines = find.split('\n');

  if (searchLines[searchLines.length - 1] === '') {
    searchLines.pop();
  }

  for (let i = 0; i <= originalLines.length - searchLines.length; i++) {
    let matches = true;

    for (let j = 0; j < searchLines.length; j++) {
      const originalLine = originalLines[i + j];
      const searchLine = searchLines[j];
      if (!originalLine || !searchLine) continue;
      const originalTrimmed = originalLine.trim();
      const searchTrimmed = searchLine.trim();

      if (originalTrimmed !== searchTrimmed) {
        matches = false;
        break;
      }
    }

    if (matches) {
      let matchStartIndex = 0;
      for (let k = 0; k < i; k++) {
        matchStartIndex += (originalLines[k]?.length ?? 0) + 1;
      }

      let matchEndIndex = matchStartIndex;
      for (let k = 0; k < searchLines.length; k++) {
        matchEndIndex += originalLines[i + k]?.length ?? 0;
        if (k < searchLines.length - 1) {
          matchEndIndex += 1; // Add newline character except for the last line
        }
      }

      yield content.substring(matchStartIndex, matchEndIndex);
    }
  }
};

export const BlockAnchorReplacer: Replacer = function* (content, find) {
  const originalLines = content.split('\n');
  const searchLines = find.split('\n');

  if (searchLines.length < 3) {
    return;
  }

  if (searchLines[searchLines.length - 1] === '') {
    searchLines.pop();
  }

  const firstLineSearch = searchLines[0]?.trim() ?? '';
  const lastLineSearch = searchLines[searchLines.length - 1]?.trim() ?? '';
  const searchBlockSize = searchLines.length;

  // Collect all candidate positions where both anchors match
  const candidates: Array<{ startLine: number; endLine: number }> = [];
  for (let i = 0; i < originalLines.length; i++) {
    if (originalLines[i]?.trim() !== firstLineSearch) {
      continue;
    }

    // Look for the matching last line after this first line
    for (let j = i + 2; j < originalLines.length; j++) {
      if (originalLines[j]?.trim() === lastLineSearch) {
        candidates.push({ startLine: i, endLine: j });
        break; // Only match the first occurrence of the last line
      }
    }
  }

  // Return immediately if no candidates
  if (candidates.length === 0) {
    return;
  }

  // Handle single candidate scenario (using relaxed threshold)
  if (candidates.length === 1) {
    const candidate = candidates[0];
    if (!candidate) return;
    const { startLine, endLine } = candidate;
    const actualBlockSize = endLine - startLine + 1;

    let similarity = 0;
    const linesToCheck = Math.min(searchBlockSize - 2, actualBlockSize - 2); // Middle lines only

    if (linesToCheck > 0) {
      for (let j = 1; j < searchBlockSize - 1 && j < actualBlockSize - 1; j++) {
        const originalLine = originalLines[startLine + j]?.trim() ?? '';
        const searchLine = searchLines[j]?.trim() ?? '';
        const maxLen = Math.max(originalLine.length, searchLine.length);
        if (maxLen === 0) {
          continue;
        }
        const distance = levenshtein(originalLine, searchLine);
        similarity += (1 - distance / maxLen) / linesToCheck;

        // Exit early when threshold is reached
        if (similarity >= SINGLE_CANDIDATE_SIMILARITY_THRESHOLD) {
          break;
        }
      }
    } else {
      // No middle lines to compare, just accept based on anchors
      similarity = 1.0;
    }

    if (similarity >= SINGLE_CANDIDATE_SIMILARITY_THRESHOLD) {
      let matchStartIndex = 0;
      for (let k = 0; k < startLine; k++) {
        matchStartIndex += (originalLines[k]?.length ?? 0) + 1;
      }
      let matchEndIndex = matchStartIndex;
      for (let k = startLine; k <= endLine; k++) {
        matchEndIndex += originalLines[k]?.length ?? 0;
        if (k < endLine) {
          matchEndIndex += 1; // Add newline character except for the last line
        }
      }
      yield content.substring(matchStartIndex, matchEndIndex);
    }
    return;
  }

  // Calculate similarity for multiple candidates
  let bestMatch: { startLine: number; endLine: number } | null = null;
  let maxSimilarity = -1;

  for (const candidate of candidates) {
    const { startLine, endLine } = candidate;
    const actualBlockSize = endLine - startLine + 1;

    let similarity = 0;
    const linesToCheck = Math.min(searchBlockSize - 2, actualBlockSize - 2); // Middle lines only

    if (linesToCheck > 0) {
      for (let j = 1; j < searchBlockSize - 1 && j < actualBlockSize - 1; j++) {
        const originalLine = originalLines[startLine + j]?.trim() ?? '';
        const searchLine = searchLines[j]?.trim() ?? '';
        const maxLen = Math.max(originalLine.length, searchLine.length);
        if (maxLen === 0) {
          continue;
        }
        const distance = levenshtein(originalLine, searchLine);
        similarity += 1 - distance / maxLen;
      }
      similarity /= linesToCheck; // Average similarity
    } else {
      // No middle lines to compare, just accept based on anchors
      similarity = 1.0;
    }

    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      bestMatch = candidate;
    }
  }

  // Threshold judgment
  if (maxSimilarity >= MULTIPLE_CANDIDATES_SIMILARITY_THRESHOLD && bestMatch) {
    const { startLine, endLine } = bestMatch;
    let matchStartIndex = 0;
    for (let k = 0; k < startLine; k++) {
      matchStartIndex += (originalLines[k]?.length ?? 0) + 1;
    }
    let matchEndIndex = matchStartIndex;
    for (let k = startLine; k <= endLine; k++) {
      matchEndIndex += originalLines[k]?.length ?? 0;
      if (k < endLine) {
        matchEndIndex += 1;
      }
    }
    yield content.substring(matchStartIndex, matchEndIndex);
  }
};

export const WhitespaceNormalizedReplacer: Replacer = function* (content, find) {
  const normalizeWhitespace = (text: string) => text.replace(/\s+/g, ' ').trim();
  const normalizedFind = normalizeWhitespace(find);

  // Handle single line matches
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    if (normalizeWhitespace(line) === normalizedFind) {
      yield line;
    } else {
      // Only check for substring matches if the full line doesn't match
      const normalizedLine = normalizeWhitespace(line);
      if (normalizedLine.includes(normalizedFind)) {
        // Find the actual substring in the original line that matches
        const words = find.trim().split(/\s+/);
        if (words.length > 0) {
          const pattern = words
            .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .join('\\s+');
          try {
            const regex = new RegExp(pattern);
            const match = line.match(regex);
            if (match?.[0]) {
              yield match[0];
            }
          } catch (_e) {
            // Invalid regex pattern, skip
          }
        }
      }
    }
  }

  // Handle multi-line matches
  const findLines = find.split('\n');
  if (findLines.length > 1) {
    for (let i = 0; i <= lines.length - findLines.length; i++) {
      const block = lines.slice(i, i + findLines.length);
      if (normalizeWhitespace(block.join('\n')) === normalizedFind) {
        yield block.join('\n');
      }
    }
  }
};

export const IndentationFlexibleReplacer: Replacer = function* (content, find) {
  const removeIndentation = (text: string) => {
    const lines = text.split('\n');
    const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
    if (nonEmptyLines.length === 0) return text;

    const minIndent = Math.min(
      ...nonEmptyLines.map((line) => {
        const match = line.match(/^(\s*)/);
        return match?.[1]?.length ?? 0;
      })
    );

    return lines
      .map((line) => (line.trim().length === 0 ? line : line.slice(minIndent)))
      .join('\n');
  };

  const normalizedFind = removeIndentation(find);
  const contentLines = content.split('\n');
  const findLines = find.split('\n');

  for (let i = 0; i <= contentLines.length - findLines.length; i++) {
    const block = contentLines.slice(i, i + findLines.length).join('\n');
    if (removeIndentation(block) === normalizedFind) {
      yield block;
    }
  }
};

export const EscapeNormalizedReplacer: Replacer = function* (content, find) {
  const unescapeString = (str: string): string => {
    return str.replace(/\\(n|t|r|'|"|`|\\|\n|\$)/g, (match, capturedChar) => {
      switch (capturedChar) {
        case 'n':
          return '\n';
        case 't':
          return '\t';
        case 'r':
          return '\r';
        case "'":
          return "'";
        case '"':
          return '"';
        case '`':
          return '`';
        case '\\':
          return '\\';
        case '\n':
          return '\n';
        case '$':
          return '$';
        default:
          return match;
      }
    });
  };

  const unescapedFind = unescapeString(find);

  // Try direct match with unescaped find string
  if (content.includes(unescapedFind)) {
    yield unescapedFind;
  }

  // Also try finding escaped versions in content that match unescaped find
  const lines = content.split('\n');
  const findLines = unescapedFind.split('\n');

  for (let i = 0; i <= lines.length - findLines.length; i++) {
    const block = lines.slice(i, i + findLines.length).join('\n');
    const unescapedBlock = unescapeString(block);

    if (unescapedBlock === unescapedFind) {
      yield block;
    }
  }
};

export const MultiOccurrenceReplacer: Replacer = function* (content, find) {
  // This replacer yields all exact matches, allowing the replace function
  // to handle multiple occurrences based on replaceAll parameter
  let startIndex = 0;

  while (true) {
    const index = content.indexOf(find, startIndex);
    if (index === -1) break;

    yield find;
    startIndex = index + find.length;
  }
};

export const TrimmedBoundaryReplacer: Replacer = function* (content, find) {
  const trimmedFind = find.trim();

  if (trimmedFind === find) {
    // Already trimmed, no point in trying
    return;
  }

  // Try to find the trimmed version
  if (content.includes(trimmedFind)) {
    yield trimmedFind;
  }

  // Also try finding blocks where trimmed content matches
  const lines = content.split('\n');
  const findLines = find.split('\n');

  for (let i = 0; i <= lines.length - findLines.length; i++) {
    const block = lines.slice(i, i + findLines.length).join('\n');

    if (block.trim() === trimmedFind) {
      yield block;
    }
  }
};

export const ContextAwareReplacer: Replacer = function* (content, find) {
  const findLines = find.split('\n');
  if (findLines.length < 3) {
    // Need at least 3 lines to have meaningful context
    return;
  }

  // Remove trailing empty line if present
  if (findLines[findLines.length - 1] === '') {
    findLines.pop();
  }

  const contentLines = content.split('\n');

  // Extract first and last lines as context anchors
  const firstLine = findLines[0]?.trim() ?? '';
  const lastLine = findLines[findLines.length - 1]?.trim() ?? '';

  // Find blocks that start and end with the context anchors
  for (let i = 0; i < contentLines.length; i++) {
    if (contentLines[i]?.trim() !== firstLine) continue;

    // Look for the matching last line
    for (let j = i + 2; j < contentLines.length; j++) {
      if (contentLines[j]?.trim() === lastLine) {
        // Found a potential context block
        const blockLines = contentLines.slice(i, j + 1);
        const block = blockLines.join('\n');

        // Check if the middle content has reasonable similarity
        // (simple heuristic: at least 50% of non-empty lines should match when trimmed)
        if (blockLines.length === findLines.length) {
          let matchingLines = 0;
          let totalNonEmptyLines = 0;

          for (let k = 1; k < blockLines.length - 1; k++) {
            const blockLine = blockLines[k]?.trim() ?? '';
            const findLine = findLines[k]?.trim() ?? '';

            if (blockLine.length > 0 || findLine.length > 0) {
              totalNonEmptyLines++;
              if (blockLine === findLine) {
                matchingLines++;
              }
            }
          }

          if (totalNonEmptyLines === 0 || matchingLines / totalNonEmptyLines >= 0.5) {
            yield block;
            break; // Only match the first occurrence
          }
        }
        break;
      }
    }
  }
};

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

export function replace(
  content: string,
  oldString: string,
  newString: string,
  replaceAll = false
): string {
  if (oldString === newString) {
    throw new Error('oldString and newString must be different');
  }

  let notFound = true;

  for (const replacer of [
    SimpleReplacer,
    LineTrimmedReplacer,
    BlockAnchorReplacer,
    WhitespaceNormalizedReplacer,
    IndentationFlexibleReplacer,
    EscapeNormalizedReplacer,
    TrimmedBoundaryReplacer,
    ContextAwareReplacer,
    MultiOccurrenceReplacer,
  ]) {
    for (const search of replacer(content, oldString)) {
      const index = content.indexOf(search);
      if (index === -1) continue;
      notFound = false;
      if (replaceAll) {
        return content.replaceAll(search, newString);
      }
      const lastIndex = content.lastIndexOf(search);
      if (index !== lastIndex) continue;
      return content.substring(0, index) + newString + content.substring(index + search.length);
    }
  }

  if (notFound) {
    throw new Error('oldString not found in content');
  }
  throw new Error(
    'oldString found multiple times and requires more code context to uniquely identify the intended match'
  );
}

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

/**
 * Creates the execute function for the edit file tool
 */
export function createEditFileToolExecute(context: EditFileToolContext) {
  return wrapTraced(
    async function execute(input: EditFileToolInput): Promise<EditFileToolOutput> {
      const { messageId, projectDirectory, onToolEvent } = context;
      const { filePath, oldString, newString, replaceAll } = input;

      console.info(`Editing file ${filePath} for message ${messageId}`);

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

        // Check if file exists
        const file = Bun.file(absolutePath);
        const stats = await file.stat().catch(() => {});
        if (!stats) {
          return {
            success: false,
            filePath: absolutePath,
            errorMessage: `File ${filePath} not found`,
          };
        }

        if (stats.isDirectory()) {
          return {
            success: false,
            filePath: absolutePath,
            errorMessage: `Path is a directory, not a file: ${filePath}`,
          };
        }

        // Read file content
        const contentOld = await file.text();

        // Perform replacement
        const contentNew = replace(contentOld, oldString, newString, replaceAll);

        // Generate diff
        const diff = trimDiff(createTwoFilesPatch(filePath, filePath, contentOld, contentNew));

        // Write the updated content
        await Bun.write(absolutePath, contentNew);

        console.info(`Successfully edited file: ${absolutePath}`);

        const output = {
          success: true,
          filePath: absolutePath,
          message: `Successfully replaced "${oldString}" with "${newString}" in ${filePath}`,
          diff,
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
        console.error(`Error editing file ${filePath}:`, errorMessage);

        const output = {
          success: false,
          filePath,
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
    { name: 'edit-file-execute' }
  );
}
