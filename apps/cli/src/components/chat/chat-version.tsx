import { Box, Text } from 'ink';
import { memo } from 'react';
import { VERSION } from '../../version';

export const ChatVersionTagline = memo(function ChatVersionTagline() {
  return (
    <Box justifyContent="center" marginTop={1}>
      <Text>
        <Text color="#a78bfa">BUSTER v{VERSION}</Text>
        <Text color="#c4b5fd"> — Your AI Data Worker.</Text>
      </Text>
    </Box>
  );
});
