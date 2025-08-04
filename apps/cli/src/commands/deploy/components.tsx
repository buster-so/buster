import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import type { DeployArgs } from './types.js';

interface DeployUIProps {
  args: DeployArgs;
}

export const DeployUI: React.FC<DeployUIProps> = ({ args }) => {
  const [status, setStatus] = useState<'validating' | 'deploying' | 'complete' | 'error'>('validating');
  const [message, setMessage] = useState('Validating models...');

  useEffect(() => {
    // Simulate deployment process
    const timer = setTimeout(() => {
      if (args.dryRun) {
        setMessage('Dry run completed successfully');
        setStatus('complete');
      } else {
        setMessage('Models deployed successfully');
        setStatus('complete');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [args.dryRun]);

  if (status === 'complete') {
    return (
      <Box borderStyle="round" borderColor="green" padding={1}>
        <Text color="green">✓ {message}</Text>
      </Box>
    );
  }

  return (
    <Text>
      <Spinner type="dots" /> {message}
    </Text>
  );
};