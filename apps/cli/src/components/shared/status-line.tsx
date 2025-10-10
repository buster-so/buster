import { Box, Text } from 'ink';
import { UI_CONSTANTS } from '../../constants/ui';

interface StatusLineProps {
  message: string;
  status?: 'success' | 'error' | 'info';
}

/**
 * Shared status line component
 * Displays status messages with consistent formatting and colors
 */
export function StatusLine({ message, status = 'info' }: StatusLineProps) {
  const color =
    status === 'success'
      ? UI_CONSTANTS.COLORS.TEXT_DIM
      : status === 'error'
        ? UI_CONSTANTS.COLORS.ERROR
        : UI_CONSTANTS.COLORS.TEXT_DIM;

  return (
    <Box paddingLeft={UI_CONSTANTS.PADDING.INDENT}>
      <Text color={color} dimColor={status !== 'error'}>
        ↳ {message}
      </Text>
    </Box>
  );
}
