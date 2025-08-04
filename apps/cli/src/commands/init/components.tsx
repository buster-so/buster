import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import type { InitArgs } from './types.js';
import { initializeProject } from './helpers.js';

interface InitUIProps {
  args: InitArgs;
}

type Step = 'input' | 'creating' | 'complete' | 'error';

export const InitUI: React.FC<InitUIProps> = ({ args }) => {
  const [step, setStep] = useState<Step>('input');
  const [projectName, setProjectName] = useState(args.name || '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!projectName) return;
    
    setStep('creating');
    
    try {
      await initializeProject({
        name: projectName,
        path: args.path,
      });
      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Initialization failed');
      setStep('error');
    }
  };

  if (args.skipPrompts && !args.name) {
    return (
      <Box borderStyle="round" borderColor="red" padding={1}>
        <Text color="red">❌ Project name is required when using --skip-prompts</Text>
      </Box>
    );
  }

  if (args.skipPrompts && args.name) {
    handleSubmit();
  }

  if (step === 'input' && !args.skipPrompts) {
    return (
      <Box flexDirection="column" gap={1}>
        <Text>Initialize a new Buster project</Text>
        <Box>
          <Text>Project name: </Text>
          <TextInput
            value={projectName}
            onChange={setProjectName}
            placeholder="my-buster-project"
            onSubmit={handleSubmit}
          />
        </Box>
      </Box>
    );
  }

  if (step === 'creating') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text>
          <Spinner type="dots" /> Creating project structure...
        </Text>
        <Text dimColor>  → Creating buster folder</Text>
        <Text dimColor>  → Creating docs folder</Text>
        <Text dimColor>  → Creating metadata folder</Text>
        <Text dimColor>  → Generating buster.yml</Text>
      </Box>
    );
  }

  if (step === 'complete') {
    return (
      <Box flexDirection="column" gap={1}>
        <Box borderStyle="round" borderColor="green" padding={1}>
          <Text color="green">✓ Project initialized successfully!</Text>
        </Box>
        <Text>Created the following structure:</Text>
        <Text>  └─ buster/</Text>
        <Text>      ├─ buster.yml</Text>
        <Text>      ├─ docs/</Text>
        <Text>      └─ metadata/</Text>
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