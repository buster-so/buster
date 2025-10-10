import { Box, Text } from 'ink';
import { UI_CONSTANTS } from '../constants/ui';
import { useExpansion } from '../hooks/use-expansion';
import type { AgentMessage } from '../types/agent-messages';
import { AgentMessageComponent } from './message';
import { IndentedContent } from './shared/indented-content';
import { StatusLine } from './shared/status-line';

interface TaskMessageProps {
  message: Extract<AgentMessage, { kind: 'task' }>;
}

/**
 * Component for displaying task delegated task execution
 * Shows TASK badge, instructions, and nested messages from task
 * Supports expansion with Ctrl+O to show all task messages
 */
export function TaskMessage({ message }: TaskMessageProps) {
  const isExpanded = useExpansion();
  const { args, result } = message;

  if (!result) {
    return null;
  }

  // Handle error case
  if (result.status === 'error') {
    return (
      <Box flexDirection='column' marginBottom={1}>
        <Box flexDirection='row'>
          <Text bold color='white' backgroundColor={UI_CONSTANTS.TOOL_COLORS.EXECUTE}>
            TASK
          </Text>
        </Box>
        <StatusLine message={`Error: ${result.error_message}`} status='error' />
      </Box>
    );
  }

  // Count tool calls for summary
  const toolCallCount = result.messages?.length || 0;
  const hasMessages = toolCallCount > 0;

  // Truncate instructions for display
  const instructionsPreview =
    args.instructions.length > 80 ? `${args.instructions.substring(0, 80)}...` : args.instructions;

  return (
    <Box flexDirection='column' marginBottom={1}>
      {/* TASK badge with instructions preview */}
      <Box flexDirection='row'>
        <Text bold color='white' backgroundColor={UI_CONSTANTS.TOOL_COLORS.EXECUTE}>
          TASK
        </Text>
        <Text color={UI_CONSTANTS.COLORS.TEXT_SECONDARY}> ({instructionsPreview})</Text>
      </Box>

      {/* Show nested messages when expanded */}
      {isExpanded && hasMessages && (
        <IndentedContent>
          <Box flexDirection='column'>
            <Text color={UI_CONSTANTS.COLORS.TEXT_DIM} dimColor>
              ── Task Messages ──
            </Text>
            {result.messages?.map((msg, idx) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: Messages are stable and won't be reordered
              <Box key={idx}>
                <AgentMessageComponent message={msg} />
              </Box>
            ))}
            <Box marginTop={1}>
              <Text color={UI_CONSTANTS.COLORS.TEXT_DIM} dimColor>
                ── End Task Messages ──
              </Text>
            </Box>
          </Box>
        </IndentedContent>
      )}

      {/* Expansion hint if there are messages */}
      {hasMessages && !isExpanded && (
        <Box paddingLeft={UI_CONSTANTS.PADDING.INDENT}>
          <Text color={UI_CONSTANTS.COLORS.TEXT_DIM} dimColor>
            Press Ctrl+O to view {toolCallCount} task message
            {toolCallCount !== 1 ? 's' : ''}
          </Text>
        </Box>
      )}
      {hasMessages && isExpanded && (
        <Box paddingLeft={UI_CONSTANTS.PADDING.INDENT}>
          <Text color={UI_CONSTANTS.COLORS.TEXT_DIM} dimColor>
            (Press Ctrl+O to collapse)
          </Text>
        </Box>
      )}

      {/* Status line with summary */}
      <StatusLine
        message={
          result.summary ||
          `Completed with ${toolCallCount} tool call${toolCallCount !== 1 ? 's' : ''}`
        }
        status='success'
      />
    </Box>
  );
}
