import chalk from 'chalk';
import { Box, Text } from 'ink';
import React, { useEffect } from 'react';

interface HelloCommandProps {
  name: string;
  uppercase?: boolean;
}

export const HelloCommand: React.FC<HelloCommandProps> = ({ name, uppercase }) => {
  const greeting = `Hello, ${name}!`;
  const displayText = uppercase ? greeting.toUpperCase() : greeting;

  useEffect(() => {
    // Exit after rendering
    setTimeout(() => {
      process.exit(0);
    }, 100);
  }, []);

  return (
    <Box flexDirection='column'>
      <Text color='green'>{chalk.bold('🚀 Buster CLI')}</Text>
      <Text>{displayText}</Text>
    </Box>
  );
};
