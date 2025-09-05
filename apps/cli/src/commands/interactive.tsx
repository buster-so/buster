import chalk from 'chalk';
import { Box, Text, useApp, useInput } from 'ink';
import React, { useState } from 'react';

export const InteractiveCommand: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState(0);
  const { exit } = useApp();

  const options = ['Create a new project', 'Deploy to production', 'Run tests', 'Exit'];

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedOption((prev) => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedOption((prev) => Math.min(options.length - 1, prev + 1));
    } else if (key.return) {
      if (selectedOption === options.length - 1) {
        exit();
      } else {
        // Handle selection
        console.info(`\nYou selected: ${options[selectedOption]}`);
        exit();
      }
    } else if (input === 'q' || key.escape) {
      exit();
    }
  });

  return (
    <Box flexDirection='column'>
      <Box marginBottom={1}>
        <Text color='cyan' bold>
          🚀 Buster CLI - Interactive Mode
        </Text>
      </Box>

      <Text dimColor>Use arrow keys to navigate, Enter to select, Q to quit</Text>
      <Box marginTop={1} flexDirection='column'>
        {options.map((option, index) => (
          <Box key={option}>
            <Text {...(selectedOption === index ? { color: 'green' } : {})}>
              {selectedOption === index ? chalk.bold('▶ ') : '  '}
              {option}
            </Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
