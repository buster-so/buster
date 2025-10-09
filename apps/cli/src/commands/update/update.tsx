import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { useEffect, useState } from 'react';
import { getCurrentVersion, updateHandler } from './update-handler';
import type { UpdateOptions } from './update-schemas';

interface UpdateCommandProps extends UpdateOptions {}

export function UpdateCommand({ check, force, yes }: UpdateCommandProps) {
  const [status, setStatus] = useState<'checking' | 'updating' | 'done' | 'error'>('checking');
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const runUpdate = async () => {
      try {
        setStatus(check ? 'checking' : 'updating');

        // Defer the execution to avoid React render cycle conflicts
        await new Promise((resolve) => setTimeout(resolve, 0));

        const result = await updateHandler({ check, force, yes });

        setMessage(result.message);
        setStatus('done');

        // Exit with appropriate code
        process.exit(result.success ? 0 : 1);
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        process.exit(1);
      }
    };

    runUpdate();
  }, [check, force, yes]);

  if (status === 'error') {
    return (
      <Box flexDirection='column'>
        <Text color='red'>✗ Update failed</Text>
        <Text color='red'>{error}</Text>
      </Box>
    );
  }

  if (status === 'done') {
    return (
      <Box flexDirection='column'>
        <Text>{message}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection='column'>
      <Box>
        <Text color='blue'>
          <Spinner type='dots' />
        </Text>
        <Text> {status === 'checking' ? 'Checking for updates...' : 'Updating Buster CLI...'}</Text>
      </Box>
      <Text color='dim'>Current version: v{getCurrentVersion()}</Text>
    </Box>
  );
}
