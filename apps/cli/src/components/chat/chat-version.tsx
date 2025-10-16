import { Box, Text } from 'ink';
import { memo } from 'react';

export const ChatVersionTagline = memo(function ChatVersionTagline() {
  return (
    <Box justifyContent="center" marginTop={1}>
      <Text>
        <Text color="#a78bfa">BUSTER v0.3.1</Text>
        <Text color="#c4b5fd"> — Your AI Data Worker.</Text>
      </Text>
    </Box>
  );
});
