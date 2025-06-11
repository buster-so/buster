import { Agent } from '@mastra/core';
import {
  executeSql,
  respondWithoutAnalysis,
  sequentialThinking,
  submitThoughts,
} from '../../tools';
import { anthropicCachedModel } from '../../utils/models/anthropic-cached';
import { getThinkAndPrepInstructions } from './think-and-prep-instructions';

const DEFAULT_OPTIONS = {
  maxSteps: 18,
  temperature: 0,
  maxTokens: 10000,
  providerOptions: {
    anthropic: {
      disableParallelToolCalls: true,
    },
  },
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
  defaultGenerateOptions: DEFAULT_OPTIONS,
  defaultStreamOptions: DEFAULT_OPTIONS,
});
