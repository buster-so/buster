import { Box, Text } from 'ink';
import { memo, useMemo } from 'react';

export const ChatIntroText = memo(function ChatIntroText() {
  const lines = useMemo(
    () => [
      'You are standing in an open terminal. An AI awaits your commands.',
      'ENTER send • \\n newline • @ files • / commands',
    ],
    []
  );

  return (
    <Box flexDirection="column" alignItems="center" marginTop={1}>
      {lines.map((line) => (
        <Text key={line} color="#e0e7ff">
          {line}
        </Text>
      ))}
    </Box>
  );
});
