import { Box, Text } from 'ink';
import { UI_CONSTANTS } from '../constants/ui';
import { useExpansion } from '../hooks/use-expansion';
import type { AgentMessage } from '../types/agent-messages';
import { ExpansionHint } from './shared/expansion-hint';
import { IndentedContent } from './shared/indented-content';
import { StatusLine } from './shared/status-line';
import { ToolBadge } from './shared/tool-badge';

interface EditMessageProps {
  message: Extract<AgentMessage, { kind: 'edit' }>;
}

interface ParsedDiffLine {
  lineNumber?: number;
  type: 'add' | 'remove' | 'context';
  content: string;
}

/**
 * Parse unified diff format into structured line data
 */
function parseDiff(diff: string): { lines: ParsedDiffLine[]; additions: number; removals: number } {
  const lines: ParsedDiffLine[] = [];
  let additions = 0;
  let removals = 0;
  let oldLineNumber = 0;
  let newLineNumber = 0;

  const diffLines = diff.split('\n');

  for (const line of diffLines) {
    // Skip header lines
    if (line.startsWith('---') || line.startsWith('+++') || line.startsWith('@@')) {
      // Extract line numbers from @@ marker
      if (line.startsWith('@@')) {
        const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
        if (match) {
          oldLineNumber = Number.parseInt(match[1] || '1', 10);
          newLineNumber = Number.parseInt(match[2] || '1', 10);
        }
      }
      continue;
    }

    if (line.startsWith('+')) {
      lines.push({ lineNumber: newLineNumber++, type: 'add', content: line.slice(1) });
      additions++;
    } else if (line.startsWith('-')) {
      lines.push({ lineNumber: oldLineNumber++, type: 'remove', content: line.slice(1) });
      removals++;
    } else if (line.startsWith(' ')) {
      lines.push({ lineNumber: newLineNumber++, type: 'context', content: line.slice(1) });
      oldLineNumber++;
    }
  }

  return { lines, additions, removals };
}

/**
 * Component for displaying file edit operations with diff view
 * Shows UPDATE badge, file summary, and colored diff
 * Supports expansion with Ctrl+O to show full diff
 */
export function EditMessage({ message }: EditMessageProps) {
  const isExpanded = useExpansion();
  const { args, result } = message;

  if (!result) {
    return null;
  }

  // Get diff (either from single edit or multi-edit)
  const diffString = result.diff || result.finalDiff;

  if (!diffString) {
    return (
      <Box flexDirection='column' marginBottom={1}>
        <ToolBadge tool='UPDATE' filePath={result.filePath} />
        <StatusLine
          message={
            result.success
              ? result.message || 'File updated'
              : result.errorMessage || 'Update failed'
          }
          status={result.success ? 'success' : 'error'}
        />
      </Box>
    );
  }

  // Parse the diff
  const { lines, additions, removals } = parseDiff(diffString);

  // Show first 10 lines when not expanded, all lines when expanded
  const displayLines = isExpanded ? lines : lines.slice(0, UI_CONSTANTS.LINE_LIMITS.DIFF_PREVIEW);

  return (
    <Box flexDirection='column' marginBottom={1}>
      {/* UPDATE badge with file path */}
      <ToolBadge tool='UPDATE' filePath={result.filePath} />

      {/* Summary line */}
      <StatusLine
        message={`Updated with ${additions} addition${additions !== 1 ? 's' : ''} and ${removals} removal${removals !== 1 ? 's' : ''}`}
        status='success'
      />

      {/* Diff lines - always show with indentation */}
      {displayLines.length > 0 && (
        <IndentedContent>
          {displayLines.map((line, idx) => {
            // Format line number if present
            const lineNum = line.lineNumber ? `${line.lineNumber}`.padStart(4, ' ') : '    ';

            // Choose background color and prefix based on line type
            let backgroundColor: string | undefined;
            let prefix = ' ';

            if (line.type === 'add') {
              backgroundColor = UI_CONSTANTS.COLORS.SUCCESS;
              prefix = '+';
            } else if (line.type === 'remove') {
              backgroundColor = UI_CONSTANTS.COLORS.ERROR;
              prefix = '-';
            }

            return (
              <Text
                key={idx}
                color={UI_CONSTANTS.COLORS.TEXT_PRIMARY}
                {...(backgroundColor && { backgroundColor })}
              >
                {lineNum} {prefix} {line.content}
              </Text>
            );
          })}
        </IndentedContent>
      )}

      {/* Expansion hint if diff is long */}
      <ExpansionHint
        isExpanded={isExpanded}
        totalLines={lines.length}
        visibleLines={UI_CONSTANTS.LINE_LIMITS.DIFF_PREVIEW}
      />
    </Box>
  );
}
