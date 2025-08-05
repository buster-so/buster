import React, { useState } from 'react';
import { Box, Text } from 'ink';
import ConfirmInput from 'ink-confirm-input';
import Spinner from 'ink-spinner';
import { ErrorBox, SuccessBox } from '../../components/common/index.js';
import type { ResetArgs } from './types.js';

interface ResetUIProps {
  args: ResetArgs;
}

export const ResetUI: React.FC<ResetUIProps> = ({ args }) => {
  const [step, setStep] = useState<'confirm' | 'resetting' | 'complete'>(
    args.force ? 'resetting' : 'confirm'
  );
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = (value: boolean) => {
    setConfirmed(value);
    if (value) {
      setStep('resetting');
      // Simulate reset process
      setTimeout(() => {
        setStep('complete');
      }, 3000);
    }
  };

  if (step === 'confirm' && !args.force) {
    return (
      <Box flexDirection="column" gap={1}>
        <Text color="yellow">
          ⚠️  Warning: This will {args.hard ? 'remove ALL data and' : ''} reset Buster services.
        </Text>
        <Box>
          <Text>Are you sure you want to continue? </Text>
          <ConfirmInput onConfirm={handleConfirm} />
        </Box>
      </Box>
    );
  }

  if (step === 'resetting') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text>
          <Spinner type="dots" /> Resetting services...
        </Text>
        {args.hard && <Text dimColor>  Removing data...</Text>}
        <Text dimColor>  Stopping containers...</Text>
        <Text dimColor>  Cleaning up resources...</Text>
      </Box>
    );
  }

  if (step === 'complete') {
    return (
      <SuccessBox 
        message={`Services ${args.hard ? 'and data ' : ''}reset successfully`} 
      />
    );
  }

  if (step === 'confirm' && !confirmed) {
    return <Text>Reset cancelled</Text>;
  }

  return null;
};