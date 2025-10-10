import { Box, Text, useInput } from 'ink';
import { useEffect, useState } from 'react';
import { type Settings, loadSettings, saveSettings } from '../utils/settings';

interface SettingsFormProps {
  onClose: () => void;
}

interface SettingOption {
  key: keyof Settings;
  label: string;
  type: 'boolean' | 'select';
  options?: string[];
  description: string;
}

const SETTING_OPTIONS: SettingOption[] = [
  {
    key: 'vimMode',
    label: 'Vim Mode',
    type: 'boolean',
    description: 'Enable vim keybindings in the chat input',
  },
];

export function SettingsForm({ onClose }: SettingsFormProps) {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useInput((input, key) => {
    if (key.escape) {
      if (isEditing) {
        setIsEditing(false);
      } else {
        onClose();
      }
      return;
    }

    if (!isEditing) {
      // Navigation
      if (key.upArrow) {
        setSelectedIndex((prev) => Math.max(0, prev - 1));
        return;
      }
      if (key.downArrow) {
        setSelectedIndex((prev) => Math.min(SETTING_OPTIONS.length - 1, prev + 1));
        return;
      }

      // Edit value
      if (key.return || input === ' ') {
        const option = SETTING_OPTIONS[selectedIndex];
        if (!option) return;

        if (option.type === 'boolean') {
          const currentValue = settings[option.key] as boolean;
          const newSettings = { ...settings, [option.key]: !currentValue };
          setSettings(newSettings);
          setHasChanges(true);
        } else if (option.type === 'select') {
          setIsEditing(true);
        }
        return;
      }

      // Save and exit
      if (input === 's' && hasChanges) {
        saveSettings(settings);
        onClose();
        return;
      }

      // Discard and exit
      if (input === 'q') {
        onClose();
        return;
      }
    } else {
      // Editing select value
      const option = SETTING_OPTIONS[selectedIndex];
      if (!option) return;

      if (option.type === 'select' && option.options) {
        const currentValue = String(settings[option.key]);
        const currentIndex = option.options.indexOf(currentValue);

        if (key.leftArrow) {
          const newIndex = Math.max(0, currentIndex - 1);
          const newValue = option.options[newIndex];
          if (newValue !== undefined) {
            const newSettings = { ...settings, [option.key]: newValue } as unknown as Settings;
            setSettings(newSettings);
            setHasChanges(true);
          }
          return;
        }
        if (key.rightArrow) {
          const newIndex = Math.min(option.options.length - 1, currentIndex + 1);
          const newValue = option.options[newIndex];
          if (newValue !== undefined) {
            const newSettings = { ...settings, [option.key]: newValue } as unknown as Settings;
            setSettings(newSettings);
            setHasChanges(true);
          }
          return;
        }
        if (key.return) {
          setIsEditing(false);
          return;
        }
      }
    }
  });

  // Auto-save on changes after a delay
  useEffect(() => {
    if (hasChanges) {
      const timer = setTimeout(() => {
        saveSettings(settings);
        setHasChanges(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [settings, hasChanges]);

  return (
    <Box flexDirection='column' borderStyle='single' borderColor='#6b7280' padding={1}>
      <Box marginBottom={1}>
        <Text bold color='#a78bfa'>
          ⚙️ Settings
        </Text>
        {hasChanges && (
          <Text dimColor italic>
            {' '}
            (unsaved changes)
          </Text>
        )}
      </Box>

      <Box flexDirection='column' gap={1}>
        {SETTING_OPTIONS.map((option, index) => {
          const isSelected = index === selectedIndex;
          const value = settings[option.key];

          return (
            <Box key={option.key} flexDirection='column'>
              <Box>
                <Text color={isSelected ? '#e9d5ff' : '#9ca3af'}>
                  {isSelected ? '› ' : '  '}
                  <Text bold color={isSelected ? '#ffffff' : '#e5e7eb'}>
                    {option.label}:
                  </Text>{' '}
                  {option.type === 'boolean' ? (
                    <Text color={value ? '#86efac' : '#fca5a5'}>
                      {value ? '✓ Enabled' : '✗ Disabled'}
                    </Text>
                  ) : (
                    <Text color='#60a5fa'>
                      {isEditing && isSelected ? '◀ ' : ''}
                      {String(value)}
                      {isEditing && isSelected ? ' ▶' : ''}
                    </Text>
                  )}
                </Text>
              </Box>
              {isSelected && (
                <Box paddingLeft={2}>
                  <Text dimColor italic>
                    {option.description}
                  </Text>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      <Box marginTop={1} borderTop borderColor='#6b7280' paddingTop={1}>
        <Text dimColor>
          <Text bold>SPACE/ENTER</Text> toggle • <Text bold>S</Text> save • <Text bold>Q</Text> quit
          • <Text bold>ESC</Text> cancel
        </Text>
      </Box>
    </Box>
  );
}
