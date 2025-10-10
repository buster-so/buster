import { Box, Text, useInput } from 'ink';
import { useEffect, useState } from 'react';
import type { FileSearchResult } from '../utils/file-search';

interface FileAutocompleteProps {
  items: FileSearchResult[];
  onSelect: (item: FileSearchResult, addSpace: boolean) => void;
  onClose: () => void;
  isActive?: boolean;
  maxDisplay?: number;
}

export function FileAutocomplete({
  items,
  onSelect,
  onClose,
  isActive = false, // Changed default to false - parent controls this
  maxDisplay = 10,
}: FileAutocompleteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const displayItems = items.slice(0, maxDisplay);

  // Reset selection when items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  useInput(
    (_input, key) => {
      if (key.escape) {
        onClose();
        return;
      }

      if (key.return) {
        if (displayItems[selectedIndex]) {
          // Enter adds the file with a space
          onSelect(displayItems[selectedIndex], true);
        }
        return;
      }

      if (key.upArrow) {
        setSelectedIndex((prev) => Math.max(0, prev - 1));
        return;
      }

      if (key.downArrow) {
        setSelectedIndex((prev) => Math.min(displayItems.length - 1, prev + 1));
        return;
      }

      if (key.tab) {
        // Tab also selects the current item with a space
        if (displayItems[selectedIndex]) {
          onSelect(displayItems[selectedIndex], true);
        }
        return;
      }
    },
    { isActive }
  );

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
