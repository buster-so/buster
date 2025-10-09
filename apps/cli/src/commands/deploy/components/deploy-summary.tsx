import { Box, Text } from 'ink';
import type { CLIDeploymentResult } from '../schemas';

interface DeploySummaryProps {
  result: CLIDeploymentResult;
}

/**
 * Display comprehensive deployment results
 */
export function DeploySummary({ result }: DeploySummaryProps) {
  const totalDeployed = result.success.length + result.updated.length;
  const hasFailures = result.failures.length > 0;

  return (
    <Box flexDirection="column" marginY={1}>
      <Text bold color="cyan">
        📊 Deployment Summary
      </Text>
      <Text color="dim">{'='.repeat(40)}</Text>

      {/* Success metrics */}
      <Box flexDirection="column" marginY={1}>
        <Text color="green">✅ Successfully deployed: {totalDeployed} models</Text>

        {result.success.length > 0 && (
          <Box marginLeft={2}>
            <Text color="green">✨ New models: {result.success.length}</Text>
          </Box>
        )}

        {result.updated.length > 0 && (
          <Box marginLeft={2}>
            <Text color="cyan">🔄 Updated models: {result.updated.length}</Text>
          </Box>
        )}

        {result.noChange.length > 0 && (
          <Box marginLeft={2}>
            <Text color="dim">➖ No changes: {result.noChange.length}</Text>
          </Box>
        )}
      </Box>

      {/* Exclusions */}
      {result.excluded.length > 0 && (
        <Text color="yellow">⛔ Excluded: {result.excluded.length} files</Text>
      )}

      {/* Failures */}
      {hasFailures && (
        <Box flexDirection="column" marginTop={1}>
          <Text color="red">❌ Failed: {result.failures.length} models</Text>
          <Text color="dim">{'-'.repeat(40)}</Text>

          {result.failures.slice(0, 5).map((failure) => (
            <Box
              key={`${failure.file}-${failure.modelName}`}
              flexDirection="column"
              marginLeft={2}
              marginY={0.5}
            >
              <Text color="yellow">File: {failure.file}</Text>
              <Text color="magenta">Model: {failure.modelName}</Text>
              {failure.errors.map((error: string) => (
                <Box key={error} marginLeft={2}>
                  <Text color="red">• {error}</Text>
                </Box>
              ))}
            </Box>
          ))}

          {result.failures.length > 5 && (
            <Text color="dim" italic>
              ...and {result.failures.length - 5} more failures
            </Text>
          )}
        </Box>
      )}

      <Text color="dim">{'='.repeat(40)}</Text>

      {/* Final status */}
      {hasFailures ? (
        <Text color="yellow" bold>
          ⚠️ Some models failed to deploy. Please check the errors above.
        </Text>
      ) : (
        <Text color="green" bold>
          🎉 All models processed successfully!
        </Text>
      )}
    </Box>
  );
}
