import React from 'react';
import { Box, Text } from 'ink';

interface ErrorBoxProps {
  error: Error | string;
  title?: string;
}

export const ErrorBox: React.FC<ErrorBoxProps> = ({ error, title = 'Error' }) => {
  const message = error instanceof Error ? error.message : error;
  
  return (
    <Box borderStyle="round" borderColor="red" padding={1} marginY={1}>
      <Text color="red" bold>
        ❌ {title}: {message}
      </Text>
    </Box>
  );
};