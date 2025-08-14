import { Agent } from '@mastra/core';
import {
  executeSql,
  messageUserClarifyingQuestion,
  respondWithoutAssetCreation,
  sequentialThinking,
  submitThoughts,
  updateInvestigationPlan,
} from '../../tools';
import { GPT5 } from '../../utils';
import { Sonnet4 } from '../../utils/models/sonnet-4';

const DEFAULT_OPTIONS = {
  maxSteps: 25,
  temperature: 1,
  providerOptions: {
    anthropic: {
      disableParallelToolCalls: true,
      // maxTokens: 10000,
    },
    openai: {
      parallelToolCalls: false,
      reasoningEffort: 'minimal',
      verbosity: 'low',
    },
  },
};

export const thinkAndPrepAgent = new Agent({
  name: 'Think and Prep Agent',
  instructions: '', // We control the system messages in the step at stream instantiation
  model: GPT5,
  tools: {
    sequentialThinking,
    executeSql,
    respondWithoutAssetCreation,
    submitThoughts,
    messageUserClarifyingQuestion,
    updateInvestigationPlan,
  },
  defaultGenerateOptions: DEFAULT_OPTIONS,
  defaultStreamOptions: DEFAULT_OPTIONS,
});
