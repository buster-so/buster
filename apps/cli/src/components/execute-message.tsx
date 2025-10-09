import { Box, Text } from 'ink';
import { UI_CONSTANTS } from '../constants/ui';
import { useExpansion } from '../hooks/use-expansion';
import type { AgentMessage } from '../types/agent-messages';
import { getLastLines } from '../utils/content-preview';
import { ContentLines } from './shared/content-lines';
import { ExpansionHint } from './shared/expansion-hint';
import { IndentedContent } from './shared/indented-content';

interface ExecuteMessageProps {
  message: Extract<AgentMessage, { kind: 'bash' | 'grep' | 'ls' }>;
}

/**
 * Component for displaying bash, grep, and ls command execution
 * Shows EXECUTE badge, command description, and output logs
 * Supports expansion with Ctrl+O to show full output
 */
export function ExecuteMessage({ message }: ExecuteMessageProps) {
  const isExpanded = useExpansion();
  const { args, result } = message;

  // Get command description and output based on tool type
  let description = '';
  let output = '';
  let exitCode: number | undefined;
  let success = true;

  if (message.kind === 'bash') {
    description = 'description' in args ? args.description || args.command : args.command;
    if (result && 'exitCode' in result) {
      output = result.stdout || result.stderr || '';
      exitCode = result.exitCode;
      success = result.success;
    }
  } else if (message.kind === 'grep') {
    if ('pattern' in args) {
      description = `Search for "${args.pattern}"${args.glob ? ` in ${args.glob}` : ''}`;
    }
    if (result && 'matches' in result) {
      output = result.matches.map((m: any) => `${m.path}:${m.lineNum}: ${m.lineText}`).join('\n');
      success = result.totalMatches > 0;
    }
  } else if (message.kind === 'ls') {
    description = `List directory ${'path' in args ? args.path || '.' : '.'}`;
    if (result && 'output' in result) {
      output = result.output;
      success = result.success;
    }
  }

  // Split output into lines for display
  const outputLines = output.split('\n').filter(Boolean);

  // Show last 5 lines when not expanded, all lines when expanded
  const displayLines = getLastLines(output, UI_CONSTANTS.LINE_LIMITS.DEFAULT_PREVIEW, isExpanded);

  return (
    <Box flexDirection='column' marginBottom={1}>
      {/* EXECUTE badge with actual command in parentheses */}
      <Box flexDirection='row'>
        <Text bold color='white' backgroundColor={UI_CONSTANTS.TOOL_COLORS.EXECUTE}>
          EXECUTE
        </Text>
        <Text color={UI_CONSTANTS.COLORS.TEXT_SECONDARY}> ({args.command})</Text>
      </Box>

      {/* Output lines - always show with indentation */}
      {outputLines.length > 0 && (
        <IndentedContent>
          <ContentLines lines={displayLines} />
        </IndentedContent>
      )}

      {/* Exit code/status line with indentation */}
      {message.kind === 'bash' && exitCode !== undefined && (
        <IndentedContent>
          <Text color={success ? UI_CONSTANTS.COLORS.TEXT_DIM : UI_CONSTANTS.COLORS.ERROR} dimColor>
            ↳ Exit code: {exitCode}. Output: {outputLines.length} lines.
          </Text>
        </IndentedContent>
      )}

      {message.kind === 'grep' && result && 'totalMatches' in result && (
        <IndentedContent>
          <Text
            color={
              result.totalMatches > 0 ? UI_CONSTANTS.COLORS.SUCCESS : UI_CONSTANTS.COLORS.WARNING
            }
          >
            ↳ Found {result.totalMatches} match{result.totalMatches !== 1 ? 'es' : ''}
            {result.truncated ? ' (truncated)' : ''}
          </Text>
        </IndentedContent>
      )}

      {message.kind === 'ls' && result && 'count' in result && (
        <IndentedContent>
          <Text color={result.success ? UI_CONSTANTS.COLORS.SUCCESS : UI_CONSTANTS.COLORS.ERROR}>
            ↳ Listed {result.count} file{result.count !== 1 ? 's' : ''}
            {result.truncated ? ' (truncated)' : ''}
            {result.errorMessage ? `: ${result.errorMessage}` : ''}
          </Text>
        </IndentedContent>
      )}

      {/* Expansion hint if output is long */}
      <ExpansionHint
        isExpanded={isExpanded}
        totalLines={outputLines.length}
        visibleLines={UI_CONSTANTS.LINE_LIMITS.DEFAULT_PREVIEW}
      />
    </Box>
  );
}
