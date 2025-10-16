import { Box } from 'ink';
import { memo } from 'react';
import { SimpleBigText } from '../shared/simple-big-text';

export const ChatTitle = memo(function ChatTitle() {
  return (
    <Box justifyContent="center">
      <SimpleBigText text="Buster" color="#f5f3ff" />
    </Box>
  );
});
