import { Box, Text } from 'ink';
import type { FileSearchResult } from '../utils/file-search';

interface FileAutocompleteDisplayProps {
  items: FileSearchResult[];
  selectedIndex: number;
  maxDisplay?: number;
}

export function FileAutocompleteDisplay({
  items,
  selectedIndex,
  maxDisplay = 10,
}: FileAutocompleteDisplayProps) {
  const displayItems = items.slice(0, maxDisplay);

  if (items.length === 0) {
    return null; // Don't show anything when no matches
  }

  return (
    <Box flexDirection="column">
      {displayItems.map((item, index) => {
        const isSelected = index === selectedIndex;
        const { relativePath } = item;

        return (
          <Box key={relativePath}>
            <Text color={isSelected ? '#ffffff' : '#6b7280'}>
              {isSelected ? '> ' : '  '}
              {relativePath}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
