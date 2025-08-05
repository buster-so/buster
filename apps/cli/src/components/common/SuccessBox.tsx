import React from 'react';
import { Box, Text } from 'ink';

interface SuccessBoxProps {
  message: string;
  title?: string;
}

export const SuccessBox: React.FC<SuccessBoxProps> = ({ message, title = 'Success' }) => {
  return (
    <Box borderStyle="round" borderColor="green" padding={1} marginY={1}>
      <Text color="green" bold>
        ✓ {title}: {message}
      </Text>
    </Box>
  );
};