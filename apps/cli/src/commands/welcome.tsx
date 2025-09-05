import { Box, Text, useApp } from 'ink';
import React, { useEffect } from 'react';
import { AnimatedLogo } from '../components/animated-logo.js';

export function Welcome() {
  const { exit } = useApp();

  // Auto-exit after a few seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      exit();
    }, 5000);

    return () => clearTimeout(timer);
  }, [exit]);

  return (
    <Box paddingY={2} paddingX={2}>
      <Box marginRight={4}>
        <AnimatedLogo color='#7C3AED' />
      </Box>
      <Box flexDirection='column' justifyContent='center'>
        <Text bold>Welcome to Buster</Text>
        <Box marginTop={1}>
          <Text dimColor>Type / to use slash commands</Text>
        </Box>
        <Box>
          <Text dimColor>Type @ to mention files</Text>
        </Box>
        <Box>
          <Text dimColor>Ctrl-C to exit</Text>
        </Box>
        <Box marginTop={2}>
          <Text dimColor>/help for more</Text>
        </Box>
        <Box marginTop={2}>
          <Text color='#7C3AED'>"Run `buster` and fix all the errors"</Text>
        </Box>
      </Box>
    </Box>
  );
}
