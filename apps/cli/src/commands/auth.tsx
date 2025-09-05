import { createBusterSDK } from '@buster/sdk';
import { Box, Text, useApp, useInput } from 'ink';
import Spinner from 'ink-spinner';
import TextInput from 'ink-text-input';
import React, { useState, useEffect } from 'react';
import {
  type Credentials,
  deleteCredentials,
  getCredentials,
  loadCredentials,
  saveCredentials,
} from '../utils/credentials.js';

interface AuthProps {
  apiKey?: string;
  host?: string;
  local?: boolean;
  cloud?: boolean;
  clear?: boolean;
  noSave?: boolean;
  show?: boolean;
}

const DEFAULT_HOST = 'api2.buster.so';
const LOCAL_HOST = 'localhost:3001';

// Normalize host URL (add https:// if missing, unless localhost)
const normalizeHost = (h: string): string => {
  const trimmed = h.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.includes('localhost') || trimmed.includes('127.0.0.1')) {
    return `http://${trimmed}`;
  }
  return `https://${trimmed}`;
};

export function Auth({ apiKey, host, local, cloud, clear, noSave, show }: AuthProps) {
  const { exit } = useApp();
  const [step, setStep] = useState<'clear' | 'host' | 'apikey' | 'validate' | 'save' | 'done'>(
    'clear'
  );
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hostInput, setHostInput] = useState('');
  const [_error, setError] = useState<string | null>(null);
  const [_existingCreds, setExistingCreds] = useState<Credentials | null>(null);
  const [finalCreds, setFinalCreds] = useState<Credentials | null>(null);
  const [_promptStage, setPromptStage] = useState<'host' | 'apikey'>('host');

  // Handle clear and show flags
  useEffect(() => {
    if (show) {
      loadCredentials()
        .then((creds) => {
          if (creds) {
            const masked = creds.apiKey.length > 6 ? `****${creds.apiKey.slice(-6)}` : '****';
            const displayHost = creds.apiUrl.replace(/^https?:\/\//, '');
            console.log('\nCurrent Buster credentials:');
            console.log(`  Host: ${displayHost}`);
            console.log(`  API Key: ${masked}\n`);
          } else {
            console.log('\n❌ No credentials found. Run `buster auth` to configure.\n');
          }
          exit();
        })
        .catch((err: Error) => {
          console.error('❌ Failed to load credentials:', err.message);
          exit();
        });
    } else if (clear) {
      deleteCredentials()
        .then(() => {
          console.log('✅ Credentials cleared successfully');
          exit();
        })
        .catch((err: Error) => {
          console.error('❌ Failed to clear credentials:', err.message);
          exit();
        });
    } else {
      // Determine initial step based on provided flags
      loadCredentials().then((creds) => {
        setExistingCreds(creds);

        // Determine the host to use
        let targetHost = '';
        if (local) {
          targetHost = LOCAL_HOST;
        } else if (cloud) {
          targetHost = DEFAULT_HOST;
        } else if (host) {
          targetHost = host;
        }

        // If we have both host and apiKey from flags, skip to validation
        if ((targetHost || host) && apiKey) {
          const finalHost = normalizeHost(targetHost || host || DEFAULT_HOST);
          setFinalCreds({ apiKey, apiUrl: finalHost });
          setStep('validate');
        } else if (targetHost || host) {
          // If we only have host, set it and prompt for API key
          setHostInput(targetHost || host || '');
          setApiKeyInput(apiKey || '');
          setStep('apikey');
          setPromptStage('apikey');
        } else {
          // No flags provided, start with host prompt
          setHostInput('');
          setApiKeyInput(apiKey || '');
          setStep('host');
          setPromptStage('host');
        }
      });
    }
  }, [show, clear, apiKey, host, local, cloud, exit]);

  // Handle input completion
  useInput((_input, key) => {
    if (key.return) {
      if (step === 'host') {
        // Use default host if empty
        const finalHost = hostInput.trim() || DEFAULT_HOST;
        setHostInput(finalHost);
        setStep('apikey');
        setPromptStage('apikey');
      } else if (step === 'apikey') {
        if (!apiKeyInput.trim()) {
          setError('API key is required');
          return;
        }
        const finalHost = normalizeHost(hostInput || DEFAULT_HOST);
        setFinalCreds({ apiKey: apiKeyInput.trim(), apiUrl: finalHost });
        setStep('validate');
      }
    }
  });

  // Validate credentials
  useEffect(() => {
    if (step === 'validate' && finalCreds) {
      const sdk = createBusterSDK({
        apiKey: finalCreds.apiKey,
        apiUrl: finalCreds.apiUrl,
        timeout: 30000,
      });

      sdk.auth
        .isApiKeyValid()
        .then((valid: boolean) => {
          if (valid) {
            setStep(noSave ? 'done' : 'save');
          } else {
            setError('Invalid API key');
            setStep('apikey');
          }
        })
        .catch((err: Error) => {
          setError(`Validation failed: ${err.message}`);
          setStep('apikey');
        });
    }
  }, [step, finalCreds, noSave]);

  // Save credentials
  useEffect(() => {
    if (step === 'save' && finalCreds) {
      saveCredentials(finalCreds)
        .then(() => {
          setStep('done');
        })
        .catch((err: Error) => {
          setError(`Failed to save: ${err.message}`);
          setStep('done');
        });
    }
  }, [step, finalCreds]);

  // Display success and exit
  useEffect(() => {
    if (step === 'done' && finalCreds) {
      const masked = finalCreds.apiKey.length > 6 ? `****${finalCreds.apiKey.slice(-6)}` : '****';
      // Remove protocol for display
      const displayHost = finalCreds.apiUrl.replace(/^https?:\/\//, '');

      console.log("\n✅ You've successfully connected to Buster!\n");
      console.log('Connection details:');
      console.log(`  Host: ${displayHost}`);
      console.log(`  API Key: ${masked}`);

      if (!noSave && step === 'done') {
        console.log('\nCredentials saved successfully!');
      } else if (noSave) {
        console.log('\nNote: Credentials were not saved due to --no-save flag');
      }

      exit();
    }
  }, [step, finalCreds, noSave, exit]);

  // Render based on current step
  if (step === 'clear') {
    return <Text>Clearing credentials...</Text>;
  }

  if (step === 'host') {
    return (
      <Box flexDirection='column'>
        {_existingCreds && (
          <Box marginBottom={1}>
            <Text color='yellow'>⚠️ Existing credentials found. They will be overwritten.</Text>
          </Box>
        )}

        <Box>
          <Text>Enter your Buster API host (default: {DEFAULT_HOST}): </Text>
        </Box>
        <TextInput value={hostInput} onChange={setHostInput} placeholder={DEFAULT_HOST} />

        <Box marginTop={1}>
          <Text dimColor>Press Enter to continue (leave empty for default)</Text>
        </Box>
      </Box>
    );
  }

  if (step === 'apikey') {
    const displayHost = (hostInput || DEFAULT_HOST).replace(/^https?:\/\//, '');
    return (
      <Box flexDirection='column'>
        {_error && (
          <Box marginBottom={1}>
            <Text color='red'>❌ {_error}</Text>
          </Box>
        )}

        <Box>
          <Text>Enter your API key: </Text>
        </Box>
        <TextInput value={apiKeyInput} onChange={setApiKeyInput} mask='*' />

        <Box marginTop={1}>
          <Text dimColor>Find your API key at https://{displayHost}/app/settings/api-keys</Text>
        </Box>

        <Box marginTop={1}>
          <Text dimColor>Press Enter to authenticate</Text>
        </Box>
      </Box>
    );
  }

  if (step === 'validate') {
    return (
      <Box>
        <Text>
          <Spinner type='dots' /> Validating API key...
        </Text>
      </Box>
    );
  }

  if (step === 'save') {
    return (
      <Box>
        <Text>
          <Spinner type='dots' /> Saving credentials...
        </Text>
      </Box>
    );
  }

  return null;
}
