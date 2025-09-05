import { createBusterSDK } from '@buster/sdk';
import { Box, Text, useApp, useInput } from 'ink';
import { render } from 'ink';
import Spinner from 'ink-spinner';
import TextInput from 'ink-text-input';
import React, { useState, useEffect } from 'react';
import { BusterBanner } from '../components/banner.js';
import {
  type Credentials,
  getCredentials,
  hasCredentials,
  saveCredentials,
} from '../utils/credentials.js';
import { DeployCommand } from './deploy/deploy.js';
import { DeployOptionsSchema } from './deploy/schemas.js';
import { InitCommand } from './init.js';

const DEFAULT_HOST = 'https://api2.buster.so';
const _LOCAL_HOST = 'http://localhost:3001';

// Component for the welcome screen header with additional help text
function WelcomeHeader() {
  return (
    <Box paddingY={2} paddingX={2} alignItems='center'>
      <Box marginRight={4}>
        <BusterBanner showSubtitle={false} inline={true} />
      </Box>
      <Box flexDirection='column' justifyContent='center'>
        <Text bold>Welcome to Buster</Text>
        <Box marginTop={1}>
          <Text dimColor>Type / to use slash commands</Text>
        </Box>
        <Box>
          <Text dimColor>Type @ to mention files</Text>
        </Box>
        <Box>
          <Text dimColor>Ctrl-C to exit</Text>
        </Box>
        <Box marginTop={2}>
          <Text dimColor>/help for more</Text>
        </Box>
        <Box marginTop={2}>
          <Text color='#7C3AED'>"Run `buster` and fix all the errors"</Text>
        </Box>
      </Box>
    </Box>
  );
}

// Available commands definition
const COMMANDS = [
  { name: '/help', description: 'Show available commands' },
  { name: '/init', description: 'Initialize a new Buster project' },
  { name: '/deploy', description: 'Deploy semantic models to Buster API' },
  { name: '/clear', description: 'Clear the screen' },
  { name: '/exit', description: 'Exit the CLI' },
];

// Input box component for authenticated users
function CommandInput({ onSubmit }: { onSubmit: (input: string) => void }) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter commands based on input
  const filteredCommands = input.startsWith('/')
    ? COMMANDS.filter((cmd) => cmd.name.toLowerCase().startsWith(input.toLowerCase()))
    : COMMANDS;

  const handleSubmit = () => {
    // If suggestions are shown and we have a selection, use the selected command
    if (showSuggestions && filteredCommands.length > 0) {
      const selectedCommand = filteredCommands[selectedIndex];
      if (selectedCommand) {
        onSubmit(selectedCommand.name);
        setInput('');
        setShowSuggestions(false);
        setSelectedIndex(0);
      }
    } else if (input.trim()) {
      onSubmit(input);
      setInput('');
      setShowSuggestions(false);
      setSelectedIndex(0);
    }
  };

  const handleChange = (value: string) => {
    setInput(value);
    // Show suggestions when user starts typing a slash command
    setShowSuggestions(value.startsWith('/') && value.length >= 1);
    // Reset selection when input changes
    setSelectedIndex(0);
  };

  // Handle keyboard navigation
  useInput((_input, key) => {
    if (!showSuggestions) return;

    if (key.upArrow) {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
    } else if (key.downArrow) {
      setSelectedIndex((prev) => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
    } else if (key.tab) {
      // Tab autocompletes the selected command
      if (filteredCommands.length > 0) {
        const selectedCommand = filteredCommands[selectedIndex];
        if (selectedCommand) {
          setInput(selectedCommand.name);
          setShowSuggestions(false);
          setSelectedIndex(0);
        }
      }
    }
  });

  return (
    <Box flexDirection='column' paddingX={2} paddingBottom={1}>
      <Box borderStyle='single' borderColor='#7C3AED' paddingX={1} width='100%'>
        <Text color='#7C3AED'>❯ </Text>
        <TextInput
          value={input}
          onChange={handleChange}
          onSubmit={handleSubmit}
          placeholder='Enter a command or question...'
        />
      </Box>

      {/* Show command suggestions */}
      {showSuggestions && filteredCommands.length > 0 && (
        <Box flexDirection='column' marginTop={1} paddingX={1}>
          <Text color='#7C3AED' bold>
            Available Commands:
          </Text>
          {filteredCommands.map((cmd, index) => (
            <Box key={cmd.name} marginTop={1}>
              <Text color={index === selectedIndex ? 'green' : 'cyan'} bold>
                {index === selectedIndex ? '▶ ' : '  '}
                {cmd.name}
              </Text>
              <Text color={index === selectedIndex ? 'white' : 'gray'}> - {cmd.description}</Text>
            </Box>
          ))}
          <Box marginTop={1}>
            <Text dimColor>↑↓ Navigate • Tab Autocomplete • Enter Select</Text>
          </Box>
        </Box>
      )}
    </Box>
  );
}

// Auth prompt component for unauthenticated users
function AuthPrompt({ onAuth }: { onAuth: (creds: Credentials) => void }) {
  const [apiKey, setApiKey] = useState('');
  const [host] = useState(DEFAULT_HOST);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  const handleSubmit = async () => {
    if (!apiKey.trim()) {
      setError('API key is required');
      return;
    }

    setValidating(true);
    setError(null);

    try {
      const sdk = createBusterSDK({
        apiKey: apiKey.trim(),
        apiUrl: host,
        timeout: 30000,
      });

      const isValid = await sdk.auth.isApiKeyValid();

      if (isValid) {
        const creds = { apiKey: apiKey.trim(), apiUrl: host };
        await saveCredentials(creds);
        onAuth(creds);
      } else {
        setError('Invalid API key. Please check your key and try again.');
        setApiKey('');
      }
    } catch (err) {
      setError(`Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setValidating(false);
    }
  };

  if (validating) {
    return (
      <Box paddingX={2}>
        <Text>
          <Spinner type='dots' /> Validating your API key...
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection='column' paddingX={2}>
      <Box marginBottom={1}>
        <Text>Let's get you connected to Buster.</Text>
      </Box>

      {error && (
        <Box marginBottom={1}>
          <Text color='red'>❌ {error}</Text>
        </Box>
      )}

      <Box marginBottom={1}>
        <Text>Enter your API key: </Text>
      </Box>

      <Box borderStyle='single' borderColor='#7C3AED' paddingX={1}>
        <TextInput
          value={apiKey}
          onChange={setApiKey}
          onSubmit={handleSubmit}
          mask='*'
          placeholder='sk_...'
        />
      </Box>

      <Box marginTop={1}>
        <Text dimColor>Find your API key at {host}/app/settings/api-keys</Text>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>Press Enter to continue</Text>
      </Box>
    </Box>
  );
}

export function Main() {
  const { exit } = useApp();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [_credentials, setCredentials] = useState<Credentials | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const creds = await getCredentials();

        if (creds?.apiKey) {
          // Validate the stored credentials
          const sdk = createBusterSDK({
            apiKey: creds.apiKey,
            apiUrl: creds.apiUrl,
            timeout: 30000,
          });

          const isValid = await sdk.auth.isApiKeyValid();

          if (isValid) {
            setCredentials(creds);
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (_error) {
        setIsAuthenticated(false);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  // Handle keyboard shortcuts
  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      exit();
    }
  });

  const handleAuth = (creds: Credentials) => {
    setCredentials(creds);
    setIsAuthenticated(true);
  };

  const handleCommand = (command: string) => {
    setCommandHistory([...commandHistory, command]);

    // Handle special commands
    if (command === '/help') {
      console.info('\nAvailable commands:');
      console.info('  /help    - Show this help message');
      console.info('  /init    - Initialize a new Buster project');
      console.info('  /deploy  - Deploy semantic models to Buster API');
      console.info('  /clear   - Clear the screen');
      console.info('  /exit    - Exit the CLI');
      console.info('\nFor more information, visit https://docs.buster.so');
    } else if (command === '/init') {
      // Launch the init command
      render(<InitCommand />);
    } else if (command === '/deploy' || command.startsWith('/deploy ')) {
      // Parse deploy options from the command
      const parts = command.split(' ');
      const options = {
        path: process.cwd(),
        dryRun: parts.includes('--dry-run'),
        verbose: parts.includes('--verbose'),
      };

      try {
        const parsedOptions = DeployOptionsSchema.parse(options);
        render(<DeployCommand {...parsedOptions} />);
      } catch (error) {
        console.error('Invalid deploy options:', error);
      }
    } else if (command === '/clear') {
      console.clear();
    } else if (command === '/exit') {
      exit();
    } else {
      // TODO: Process the command with Buster
      console.info(`Processing: ${command}`);
      console.info('Command processing not yet implemented.');
    }
  };

  if (checkingAuth) {
    return (
      <Box flexDirection='column'>
        <WelcomeHeader />
        <Box paddingX={2}>
          <Text>
            <Spinner type='dots' /> Checking configuration...
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection='column'>
      <WelcomeHeader />

      {/* Show command history if authenticated */}
      {isAuthenticated && commandHistory.length > 0 && (
        <Box flexDirection='column' paddingX={2} marginBottom={1}>
          {commandHistory.slice(-5).map((cmd, idx) => (
            <Box key={`cmd-${idx}-${cmd}`}>
              <Text dimColor>❯ {cmd}</Text>
            </Box>
          ))}
        </Box>
      )}

      {isAuthenticated ? (
        <CommandInput onSubmit={handleCommand} />
      ) : (
        <AuthPrompt onAuth={handleAuth} />
      )}
    </Box>
  );
}
