import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Table from 'ink-table';
import TextInput from 'ink-text-input';
import ConfirmInput from 'ink-confirm-input';
import { ErrorBox, SuccessBox } from '../../components/common/index.js';
import type { ConfigArgs } from './types.js';

interface ConfigUIProps {
  args: ConfigArgs;
}

export const ConfigUI: React.FC<ConfigUIProps> = ({ args }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [configData, setConfigData] = useState<Record<string, any>>({});

  useEffect(() => {
    // Handle different config operations
    if (args.list) {
      // Mock loading config
      setStatus('loading');
      setTimeout(() => {
        setConfigData({
          defaultEnvironment: 'cloud',
          telemetry: true,
          autoUpdate: true,
        });
        setStatus('success');
      }, 500);
    } else if (args.get) {
      setMessage(`Value for ${args.get}: true`);
      setStatus('success');
    } else if (args.set) {
      setMessage(`Successfully set ${args.set}`);
      setStatus('success');
    } else if (args.reset) {
      setMessage('Configuration reset to defaults');
      setStatus('success');
    }
  }, [args]);

  if (status === 'loading') {
    return <Text>Loading configuration...</Text>;
  }

  if (args.list && status === 'success') {
    const tableData = Object.entries(configData).map(([key, value]) => ({
      Key: key,
      Value: String(value),
    }));
    
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold>Current Configuration:</Text>
        <Table data={tableData} />
      </Box>
    );
  }

  if (status === 'success') {
    return <SuccessBox message={message} />;
  }

  if (status === 'error') {
    return <ErrorBox error={message} />;
  }

  return <Text>Use --list, --get, --set, or --reset to manage configuration</Text>;
};