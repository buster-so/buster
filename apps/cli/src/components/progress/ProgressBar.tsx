import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

interface ProgressBarProps {
  progress: number; // 0-100
  message?: string;
  showSpinner?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  message, 
  showSpinner = false 
}) => {
  const width = 30;
  const filled = Math.round((progress / 100) * width);
  const empty = width - filled;
  
  return (
    <Box flexDirection="column" gap={1}>
      {message && (
        <Box gap={1}>
          {showSpinner && <Spinner type="dots" />}
          <Text>{message}</Text>
        </Box>
      )}
      <Box>
        <Text color="green">{'█'.repeat(filled)}</Text>
        <Text color="gray">{'░'.repeat(empty)}</Text>
        <Text> {progress}%</Text>
      </Box>
    </Box>
  );
};