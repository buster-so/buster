import { Box, Text } from 'ink';
import { useEffect, useState } from 'react';
import { debugLogger } from '../../utils/debug-logger';
import type { FileSearchResult } from '../../utils/file-search';
import { searchFiles } from '../../utils/file-search';
import type { SlashCommand } from '../../utils/slash-commands';
import { searchCommands } from '../../utils/slash-commands';
import type { VimMode } from '../../utils/vim-mode';
import { CommandAutocomplete } from '../input/command-autocomplete';
import { FileAutocompleteDisplay } from '../input/file-autocomplete-display';
import { MultiLineTextInput, replaceMention } from '../input/multi-line-text-input';

interface ChatInputProps {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onVimModeChange?: (mode: VimMode) => void;
  onCommandExecute?: (command: SlashCommand) => void;
  onAutocompleteStateChange?: (isOpen: boolean) => void;
  isThinking?: boolean;
}

export function ChatInput({
  value,
  placeholder,
  onChange,
  onSubmit,
  onVimModeChange,
  onCommandExecute,
  onAutocompleteStateChange,
  isThinking = false,
}: ChatInputProps) {
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState<number>(-1);
  const [searchResults, setSearchResults] = useState<FileSearchResult[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Slash command state
  const [slashQuery, setSlashQuery] = useState<string | null>(null);
  const [_slashStart, setSlashStart] = useState<number>(-1);
  const [commandResults, setCommandResults] = useState<SlashCommand[]>([]);
  const [showCommandAutocomplete, setShowCommandAutocomplete] = useState(false);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);

  // Handle mention changes from the input
  const handleMentionChange = (query: string | null, position: number) => {
    // Only reset selection if the query actually changed
    if (query !== mentionQuery) {
      setSelectedIndex(0);
    }
    setMentionQuery(query);
    setMentionStart(position);
    setShowAutocomplete(query !== null);
  };

  // Handle slash command changes
  const handleSlashChange = (query: string | null, position: number) => {
    if (query !== slashQuery) {
      setSelectedCommandIndex(0);
    }
    setSlashQuery(query);
    setSlashStart(position);
    setShowCommandAutocomplete(query !== null);
  };

  // Search for files when mention query changes
  useEffect(() => {
    if (mentionQuery !== null) {
      searchFiles(mentionQuery, { maxResults: 20 })
        .then((results) => {
          setSearchResults(results);
          // Adjust selection if it's out of bounds
          setSelectedIndex((currentIndex) => {
            if (currentIndex >= results.length && results.length > 0) {
              return results.length - 1;
            }
            return currentIndex;
          });
        })
        .catch((error) => {
          debugLogger.error('File search failed:', error);
          setSearchResults([]);
        });
    } else {
      setSearchResults([]);
    }
  }, [mentionQuery]);

  // Search for commands when slash query changes
  useEffect(() => {
    if (slashQuery !== null) {
      const results = searchCommands(slashQuery);
      setCommandResults(results);
      setSelectedCommandIndex((currentIndex) => {
        if (currentIndex >= results.length && results.length > 0) {
          return results.length - 1;
        }
        return currentIndex;
      });
    } else {
      setCommandResults([]);
    }
  }, [slashQuery]);

  // Notify parent when autocomplete state changes
  useEffect(() => {
    const isOpen = showAutocomplete || showCommandAutocomplete;
    onAutocompleteStateChange?.(isOpen);
  }, [showAutocomplete, showCommandAutocomplete, onAutocompleteStateChange]);

  // Handle autocomplete navigation
  const handleAutocompleteNavigate = (direction: 'up' | 'down' | 'select' | 'close') => {
    // Handle command autocomplete
    if (showCommandAutocomplete) {
      const displayCommands = commandResults.slice(0, 10);

      switch (direction) {
        case 'up':
          setSelectedCommandIndex((prev) => Math.max(0, prev - 1));
          break;
        case 'down':
          setSelectedCommandIndex((prev) => Math.min(displayCommands.length - 1, prev + 1));
          break;
        case 'select':
          if (displayCommands[selectedCommandIndex]) {
            const command = displayCommands[selectedCommandIndex];
            // Clear the input since we're executing a command
            onChange('');
            setShowCommandAutocomplete(false);
            setSlashQuery(null);
            setSlashStart(-1);
            // Execute the command
            if (onCommandExecute) {
              onCommandExecute(command);
            }
          }
          break;
        case 'close':
          setShowCommandAutocomplete(false);
          setSlashQuery(null);
          setSlashStart(-1);
          break;
      }
      return;
    }

    // Handle file mention autocomplete
    const displayItems = searchResults.slice(0, 10);

    switch (direction) {
      case 'up':
        setSelectedIndex((prev) => Math.max(0, prev - 1));
        break;
      case 'down':
        setSelectedIndex((prev) => Math.min(displayItems.length - 1, prev + 1));
        break;
      case 'select':
        if (displayItems[selectedIndex]) {
          const file = displayItems[selectedIndex];
          if (mentionStart !== -1 && mentionQuery !== null) {
            const mentionEnd = mentionStart + mentionQuery.length + 1; // +1 for the @ symbol
            const replacement = `@${file.relativePath} `; // Always add space
            const newValue = replaceMention(value, mentionStart, mentionEnd, replacement);
            onChange(newValue);
            setShowAutocomplete(false);
            setMentionQuery(null);
            setMentionStart(-1);
          }
        }
        break;
      case 'close':
        setShowAutocomplete(false);
        setMentionQuery(null);
        setMentionStart(-1);
        break;
    }
  };

  return (
    <Box flexDirection="column">
      <Box borderStyle="single" borderColor="#4c1d95" paddingX={1} width="100%" flexDirection="row">
        <Text color="#a855f7" bold>
          ❯{' '}
        </Text>
        <Box flexGrow={1}>
          <MultiLineTextInput
            value={value}
            onChange={onChange}
            onSubmit={onSubmit}
            onMentionChange={handleMentionChange}
            onSlashChange={handleSlashChange}
            onAutocompleteNavigate={handleAutocompleteNavigate}
            placeholder={placeholder}
            isAutocompleteOpen={showAutocomplete || showCommandAutocomplete}
            onVimModeChange={onVimModeChange || (() => {})}
            isThinking={isThinking}
          />
        </Box>
      </Box>
      {showCommandAutocomplete && (
        <Box marginTop={0} paddingLeft={2}>
          <CommandAutocomplete
            commands={commandResults}
            selectedIndex={selectedCommandIndex}
            maxDisplay={10}
          />
        </Box>
      )}
      {showAutocomplete && !showCommandAutocomplete && (
        <Box marginTop={0} paddingLeft={2}>
          <FileAutocompleteDisplay
            items={searchResults}
            selectedIndex={selectedIndex}
            maxDisplay={10}
          />
        </Box>
      )}
    </Box>
  );
}
