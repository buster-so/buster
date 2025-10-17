import { Box } from 'ink';
import type React from 'react';
import { UI_CONSTANTS } from '../../constants/ui';

interface IndentedContentProps {
  children: React.ReactNode;
}

/**
 * Shared component for indented content blocks
 * Provides consistent indentation across all message types
 */
export function IndentedContent({ children }: IndentedContentProps) {
  return (
    <Box flexDirection="column" paddingLeft={UI_CONSTANTS.PADDING.INDENT}>
      {children}
    </Box>
  );
}
