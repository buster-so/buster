import { Box, Text } from 'ink';
import { UI_CONSTANTS } from '../constants/ui';
import type { AgentMessage } from '../types/agent-messages';
import { EditMessage } from './edit-message';
import { ExecuteMessage } from './execute-message';
import { ReadMessage } from './read-message';
import { TaskMessage } from './task-message';
import { WriteMessage } from './write-message';

interface AgentMessageComponentProps {
  message: AgentMessage;
}

/**
 * Main message router component
 * Routes different message types to their appropriate display components
 */
export function AgentMessageComponent({ message }: AgentMessageComponentProps) {
  switch (message.kind) {
    case 'user':
      return (
        <Box marginBottom={1}>
          <Text color={UI_CONSTANTS.COLORS.USER_PROMPT} bold>
            ❯{' '}
          </Text>
          <Text color={UI_CONSTANTS.COLORS.TEXT_PRIMARY}>{message.content}</Text>
        </Box>
      );

    case 'text-delta':
      return (
        <Box marginBottom={1}>
          <Text color={UI_CONSTANTS.COLORS.TEXT_PRIMARY}>{message.content}</Text>
        </Box>
      );

    case 'idle':
      // For idle tool, just show the final response as plain text
      return (
        <Box marginBottom={1}>
          <Text color={UI_CONSTANTS.COLORS.TEXT_PRIMARY}>
            {message.args?.final_response || 'Task completed'}
          </Text>
        </Box>
      );

    case 'bash':
    case 'grep':
    case 'ls':
      // For execute commands, use the ExecuteMessage component
      return <ExecuteMessage message={message} />;

    case 'write':
      // For write operations, use the WriteMessage component
      return <WriteMessage message={message} />;

    case 'edit':
      // For edit operations, use the EditMessage component
      return <EditMessage message={message} />;

    case 'read':
      // For read operations, use the ReadMessage component
      return <ReadMessage message={message} />;

    case 'task':
      // For task operations, use the TaskMessage component
      return <TaskMessage message={message} />;

    default:
      return null;
  }
}
