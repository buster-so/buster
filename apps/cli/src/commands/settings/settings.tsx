import { Box, Text } from 'ink';
import { useEffect, useState } from 'react';
import { getSetting, setSetting, toggleSetting } from '../../utils/settings';

interface SettingsCommandProps {
  vimMode?: boolean;
  toggle?: string;
  show?: boolean;
}

export function SettingsCommand({ vimMode, toggle, show }: SettingsCommandProps) {
  const [settings, setSettings] = useState(() => {
    return {
      vimMode: getSetting('vimMode'),
    };
  });
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    // Handle direct vim mode setting
    if (vimMode !== undefined) {
      const updated = setSetting('vimMode', vimMode);
      setSettings(updated);
      setMessage(`Vim mode ${vimMode ? 'enabled' : 'disabled'}`);
      return;
    }

    // Handle toggle
    if (toggle) {
      if (toggle === 'vim' || toggle === 'vimMode') {
        const updated = toggleSetting('vimMode');
        setSettings(updated);
        setMessage(`Vim mode ${updated.vimMode ? 'enabled' : 'disabled'}`);
      } else {
        setMessage(`Unknown setting: ${toggle}`);
      }
      return;
    }

    // Show settings
    if (show) {
      setMessage('Current settings:');
    }
  }, [vimMode, toggle, show]);

  if (show || (!vimMode && !toggle)) {
    return (
      <Box flexDirection='column' paddingX={2} paddingY={1}>
        {message && <Text>{message}</Text>}
        <Box flexDirection='column' marginTop={1}>
          <Text>
            <Text color='cyan'>Vim Mode:</Text> {settings.vimMode ? 'enabled' : 'disabled'}
          </Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Settings are stored in ~/.buster/settings.json</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box paddingX={2} paddingY={1}>
      <Text>{message}</Text>
    </Box>
  );
}
