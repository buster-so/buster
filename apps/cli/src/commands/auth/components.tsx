import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import Spinner from 'ink-spinner';
import type { AuthArgs, Credentials } from './types.js';
import { validateAndSaveCredentials } from './helpers.js';

interface AuthUIProps {
  args: AuthArgs;
}

export const AuthUI: React.FC<AuthUIProps> = ({ args }) => {
  const [step, setStep] = useState<'input' | 'validating' | 'complete' | 'error'>('input');
  const [apiKey, setApiKey] = useState(args.apiKey || '');
  const [apiUrl, setApiUrl] = useState(args.host || process.env.BUSTER_API_URL || '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setStep('validating');
    
    try {
      const credentials: Credentials = {
        apiKey,
        apiUrl,
        environment: args.environment,
      };
      
      await validateAndSaveCredentials(credentials);
      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setStep('error');
    }
  };

  if (step === 'input') {
    return (
      <Box flexDirection="column" gap={1}>
        <Box>
          <Text>API URL: </Text>
          <TextInput
            value={apiUrl}
            onChange={setApiUrl}
            placeholder="https://api.buster.com"
            onSubmit={apiKey ? handleSubmit : undefined}
          />
        </Box>
        <Box>
          <Text>API Key: </Text>
          <TextInput
            value={apiKey}
            onChange={setApiKey}
            placeholder="Enter your API key"
            mask="*"
            onSubmit={handleSubmit}
          />
        </Box>
      </Box>
    );
  }

  if (step === 'validating') {
    return (
      <Text>
        <Spinner type="dots" /> Validating credentials...
      </Text>
    );
  }

  if (step === 'complete') {
    return (
      <Box borderStyle="round" borderColor="green" padding={1}>
        <Text color="green">✓ Successfully authenticated with Buster!</Text>
      </Box>
    );
  }

  if (step === 'error') {
    return (
      <Box borderStyle="round" borderColor="red" padding={1}>
        <Text color="red">❌ {error}</Text>
      </Box>
    );
  }

  return null;
};