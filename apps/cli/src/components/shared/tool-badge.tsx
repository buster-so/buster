import { Box, Text } from 'ink';
import { UI_CONSTANTS } from '../../constants/ui';
import { getRelativePath } from '../../utils/file-path';

interface ToolBadgeProps {
  tool: 'EXECUTE' | 'WRITE' | 'READ' | 'UPDATE';
  filePath: string;
  color?: string;
}

/**
 * Shared badge component for displaying tool name and file path
 * Provides consistent styling across all tool message types
 */
export function ToolBadge({ tool, filePath, color }: ToolBadgeProps) {
  const relativePath = getRelativePath(filePath);
  const badgeColor = color || UI_CONSTANTS.TOOL_COLORS[tool];

  return (
    <Box flexDirection='row'>
      <Text bold color='white' backgroundColor={badgeColor}>
        {tool}
      </Text>
      <Text color={UI_CONSTANTS.COLORS.TEXT_SECONDARY}> ({relativePath})</Text>
    </Box>
  );
}
