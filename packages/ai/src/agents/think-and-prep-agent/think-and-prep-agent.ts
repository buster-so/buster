import { Agent } from '@mastra/core';
import { executeSql, sequentialThinking } from '../../tools';
import respondWithoutAnalysis from '../../tools/communication-tools/respond-without-analysis';
import submitThoughts from '../../tools/communication-tools/submit-thoughts-tool';
import { anthropicCachedModel } from '../../utils/models/anthropic-cached';
import { getSharedMemory } from '../../utils/shared-memory';
import { getThinkAndPrepInstructions } from './think-and-prep-instructions';

const DEFAULT_OPTIONS = {
  maxSteps: 18,
  temperature: 0,
  maxTokens: 10000,
};

export const thinkAndPrepAgent = new Agent({
  name: 'Think and Prep Agent',
  instructions: getThinkAndPrepInstructions,
  model: anthropicCachedModel('claude-sonnet-4-20250514'),
  tools: {
    sequentialThinking,
    executeSql,
    respondWithoutAnalysis,
    submitThoughts,
  },
  memory: getSharedMemory(),
  defaultGenerateOptions: DEFAULT_OPTIONS,
  defaultStreamOptions: DEFAULT_OPTIONS,
});
