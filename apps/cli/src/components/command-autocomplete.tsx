import { Box, Text } from 'ink';
import type { SlashCommand } from '../utils/slash-commands';

interface CommandAutocompleteProps {
  commands: SlashCommand[];
  selectedIndex: number;
  maxDisplay?: number;
}

export function CommandAutocomplete({
  commands,
  selectedIndex,
  maxDisplay = 10,
}: CommandAutocompleteProps) {
  const displayCommands = commands.slice(0, maxDisplay);

  if (commands.length === 0) {
    return null; // Don't show anything when no matches
  }

  return (
    <Box flexDirection='column'>
      {displayCommands.map((command, index) => {
        const isSelected = index === selectedIndex;
        const commandText = `/${command.name}`;

        return (
          <Box key={command.name}>
            <Text color={isSelected ? '#ffffff' : '#6b7280'}>
              {isSelected ? '> ' : '  '}
              {commandText}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
