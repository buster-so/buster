import { Box } from 'ink';
import { UI_CONSTANTS } from '../constants/ui';
import { useExpansion } from '../hooks/use-expansion';
import type { AgentMessage } from '../types/agent-messages';
import { getPreviewLines } from '../utils/content-preview';
import { ContentLines } from './shared/content-lines';
import { ExpansionHint } from './shared/expansion-hint';
import { IndentedContent } from './shared/indented-content';
import { StatusLine } from './shared/status-line';
import { ToolBadge } from './shared/tool-badge';

interface WriteMessageProps {
  message: Extract<AgentMessage, { kind: 'write' }>;
}

/**
 * Component for displaying write file operations
 * Shows WRITE badge, relative file path, and file content preview
 * Supports expansion with Ctrl+O to show full content
 */
export function WriteMessage({ message }: WriteMessageProps) {
  const isExpanded = useExpansion();
  const { args, result } = message;

  // For each file, show its content
  return (
    <Box flexDirection="column" marginBottom={1}>
      {args.files.map((file, fileIdx) => {
        // Split content into lines
        const contentLines = file.content.split('\n');

        // Show first 5 lines when not expanded, all lines when expanded
        const displayLines = getPreviewLines(
          file.content,
          UI_CONSTANTS.LINE_LIMITS.DEFAULT_PREVIEW,
          isExpanded
        );

        // Find the result for this file
        const fileResult = result?.results[fileIdx];
        const success = fileResult?.status === 'success';

        return (
          <Box
            key={fileIdx}
            flexDirection="column"
            marginBottom={fileIdx < args.files.length - 1 ? 1 : 0}
          >
            {/* WRITE badge with relative file path */}
            <ToolBadge tool="WRITE" filePath={file.path} />

            {/* File content lines - always show with indentation */}
            {contentLines.length > 0 && (
              <IndentedContent>
                <ContentLines lines={displayLines} />
              </IndentedContent>
            )}

            {/* Expansion hint if content is long */}
            <ExpansionHint
              isExpanded={isExpanded}
              totalLines={contentLines.length}
              visibleLines={UI_CONSTANTS.LINE_LIMITS.DEFAULT_PREVIEW}
            />

            {/* Status line with indentation */}
            {fileResult && (
              <StatusLine
                message={
                  success
                    ? `Wrote ${contentLines.length} lines`
                    : `Failed: ${fileResult.errorMessage}`
                }
                status={success ? 'success' : 'error'}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
}
