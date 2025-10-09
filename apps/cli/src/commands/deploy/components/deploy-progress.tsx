import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

interface DeployProgressProps {
  current: number;
  total: number;
  currentFile?: string;
  currentModel?: string;
  status: string;
  isComplete?: boolean;
}

/**
 * Progress indicator component for deployment
 */
export function DeployProgress({
  current,
  total,
  currentFile,
  currentModel,
  status,
  isComplete = false,
}: DeployProgressProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <Box flexDirection="column" marginY={1}>
      <Box>
        {!isComplete && <Spinner type="dots" />}
        <Text color={isComplete ? 'green' : 'cyan'}>
          {' '}
          [{current}/{total}] {status}
        </Text>
      </Box>

      {currentFile && (
        <Box marginLeft={2}>
          <Text color="dim">File: {currentFile}</Text>
        </Box>
      )}

      {currentModel && (
        <Box marginLeft={2}>
          <Text color="dim">Model: </Text>
          <Text color="magenta">{currentModel}</Text>
        </Box>
      )}

      {/* Progress bar */}
      <Box marginTop={1}>
        <ProgressBar percentage={percentage} width={40} />
      </Box>
    </Box>
  );
}

/**
 * Simple text-based progress bar
 */
function ProgressBar({ percentage, width }: { percentage: number; width: number }) {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;

  return (
    <Box>
      <Text color="green">{'█'.repeat(filled)}</Text>
      <Text color="dim">{'░'.repeat(empty)}</Text>
      <Text color="cyan"> {percentage}%</Text>
    </Box>
  );
}
