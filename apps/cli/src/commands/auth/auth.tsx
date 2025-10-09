import { createBusterSDK } from '@buster/sdk';
import { Box, Text, useApp, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { useEffect, useState } from 'react';
import {
  type Credentials,
  deleteCredentials,
  loadCredentials,
  saveCredentials,
} from '../../utils/credentials';

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
  const [step, setStep] = useState<'init' | 'host' | 'apikey' | 'validate' | 'save' | 'done'>(
    'init'
  );
  const [currentInput, setCurrentInput] = useState('');
  const [hostValue, setHostValue] = useState('');
  const [apiKeyValue, setApiKeyValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [existingCreds, setExistingCreds] = useState<Credentials | null>(null);

  // Check if we're in a TTY environment
  const isTTY = process.stdin.isTTY;

  // Initialize based on flags
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
      // Check for existing credentials
      loadCredentials().then((creds) => {
        setExistingCreds(creds);

        // Determine initial values
        let initialHost = '';
        if (local) {
          initialHost = LOCAL_HOST;
        } else if (cloud) {
          initialHost = DEFAULT_HOST;
        } else if (host) {
          initialHost = host;
        }

        // If we have both host and apiKey from flags, skip to validation
        if ((initialHost || host) && apiKey) {
          setHostValue(initialHost || host || DEFAULT_HOST);
          setApiKeyValue(apiKey);
          setStep('validate');
        } else if (!isTTY) {
          // Non-TTY environment - require API key from flags or env
          console.error('❌ Non-interactive environment detected.');
          console.error(
            '   Please provide API key via --api-key flag or BUSTER_API_KEY environment variable.'
          );
          exit();
        } else if (initialHost || host) {
          // If we only have host, set it and prompt for API key
          setHostValue(initialHost || host || '');
          setStep('apikey');
        } else {
          // No flags provided, start with host prompt
          setStep('host');
        }
      });
    }
  }, [show, clear, apiKey, host, local, cloud, exit]);

  // Handle keyboard input only if in TTY mode
  useInput((input, key) => {
    // Skip input handling if not in TTY or not in input steps
    if (!isTTY || (step !== 'host' && step !== 'apikey')) return;

    if (key.return) {
      if (step === 'host') {
        const finalHost = currentInput.trim() || DEFAULT_HOST;
        setHostValue(finalHost);
        setCurrentInput('');
        setStep('apikey');
      } else if (step === 'apikey') {
        const trimmedKey = currentInput.trim();
        if (!trimmedKey) {
          setError('API key is required');
          return;
        }
        setApiKeyValue(trimmedKey);
        setStep('validate');
      }
    } else if (key.backspace || key.delete) {
      setCurrentInput((prev) => prev.slice(0, -1));
      setError(null);
    } else if (input && !key.ctrl && !key.meta && !key.shift) {
      // Handle normal character input including paste
      setCurrentInput((prev) => prev + input);
      setError(null);
    }
  });

  // Validate credentials
  useEffect(() => {
    if (step === 'validate' && hostValue && apiKeyValue) {
      const finalHost = normalizeHost(hostValue);
      const sdk = createBusterSDK({
        apiKey: apiKeyValue,
        apiUrl: finalHost,
        timeout: 30000,
      });

      sdk.auth
        .isApiKeyValid()
        .then((valid: boolean) => {
          if (valid) {
            if (noSave) {
              setStep('done');
            } else {
              // Save credentials
              saveCredentials({ apiKey: apiKeyValue, apiUrl: finalHost })
                .then(() => {
                  setStep('done');
                })
                .catch((err: Error) => {
                  setError(`Failed to save: ${err.message}`);
                  setStep('done');
                });
            }
          } else {
            setError('Invalid API key');
            setCurrentInput('');
            setStep('apikey');
          }
        })
        .catch((err: Error) => {
          setError(`Validation failed: ${err.message}`);
          setCurrentInput('');
          setStep('apikey');
        });
    }
  }, [step, hostValue, apiKeyValue, noSave]);

  // Display success and exit
  useEffect(() => {
    if (step === 'done') {
      const masked = apiKeyValue.length > 6 ? `****${apiKeyValue.slice(-6)}` : '****';
      const displayHost = normalizeHost(hostValue).replace(/^https?:\/\//, '');

      console.log("\n✅ You've successfully connected to Buster!\n");
      console.log('Connection details:');
      console.log(`  Host: ${displayHost}`);
      console.log(`  API Key: ${masked}`);

      if (!noSave) {
        console.log('\nCredentials saved successfully!');
      } else {
        console.log('\nNote: Credentials were not saved due to --no-save flag');
      }

      exit();
    }
  }, [step, hostValue, apiKeyValue, noSave, exit]);

  // Render based on current step
  if (step === 'init') {
    return <Text>Initializing...</Text>;
  }

  if (step === 'host') {
    return (
      <Box flexDirection='column'>
        {existingCreds && (
          <Box marginBottom={1}>
            <Text color='yellow'>⚠️ Existing credentials found. They will be overwritten.</Text>
          </Box>
        )}

        <Box>
          <Text>Enter your Buster API host (default: {DEFAULT_HOST}): </Text>
          <Text color='cyan'>{currentInput}</Text>
          <Text inverse> </Text>
        </Box>

        <Box marginTop={1}>
          <Text dimColor>Press Enter to continue (leave empty for default)</Text>
        </Box>
      </Box>
    );
  }

  if (step === 'apikey') {
    const displayHost = (hostValue || DEFAULT_HOST).replace(/^https?:\/\//, '');
    // Mask the API key display
    const maskedInput = '*'.repeat(currentInput.length);

    return (
      <Box flexDirection='column'>
        {existingCreds && (
          <Box marginBottom={1}>
            <Text color='yellow'>⚠️ Existing credentials found. They will be overwritten.</Text>
          </Box>
        )}

        {/* Show the host that was entered */}
        <Box marginBottom={1}>
          <Text>Host: </Text>
          <Text color='green'>{hostValue || DEFAULT_HOST}</Text>
        </Box>

        {error && (
          <Box marginBottom={1}>
            <Text color='red'>❌ {error}</Text>
          </Box>
        )}

        <Box>
          <Text>Enter your API key: </Text>
          <Text color='cyan'>{maskedInput}</Text>
          <Text inverse> </Text>
        </Box>

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
    const displayHost = (hostValue || DEFAULT_HOST).replace(/^https?:\/\//, '');
    const maskedKey = apiKeyValue.length > 6 ? `****${apiKeyValue.slice(-6)}` : '****';

    return (
      <Box flexDirection='column'>
        {/* Show what we're validating */}
        <Box marginBottom={1}>
          <Text>Host: </Text>
          <Text color='green'>{displayHost}</Text>
        </Box>

        <Box marginBottom={1}>
          <Text>API Key: </Text>
          <Text color='green'>{maskedKey}</Text>
        </Box>

        <Box>
          <Text>
            <Spinner type='dots' /> Validating credentials...
          </Text>
        </Box>
      </Box>
    );
  }

  return null;
}
