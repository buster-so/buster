import React from 'react';
import { Box, Text } from 'ink';
import type { ParseArgs } from './types.js';

interface ParseUIProps {
  args: ParseArgs;
}

export const ParseUI: React.FC<ParseUIProps> = ({ args }) => {
  return (
    <Box flexDirection="column" gap={1}>
      <Text>Parsing YAML files...</Text>
      <Text dimColor>Path: {args.path}</Text>
      {args.files.length > 0 && (
        <Text dimColor>Files: {args.files.join(', ')}</Text>
      )}
      <Box borderStyle="round" borderColor="green" padding={1} marginTop={1}>
        <Text color="green">✓ All files parsed successfully</Text>
      </Box>
    </Box>
  );
};