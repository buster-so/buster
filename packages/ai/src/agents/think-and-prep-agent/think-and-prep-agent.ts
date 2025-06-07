import { Agent } from '@mastra/core';
import { findRequiredTextValues, sequentialThinkingTool } from '../../tools';
import finishAndRespondTool from '../../tools/communication-tools/finish-and-respond';
import submitThoughtsTool from '../../tools/communication-tools/submit-thoughts-tool';
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
    sequentialThinkingTool,
    findRequiredTextValues,
    finishAndRespondTool,
    submitThoughtsTool,
  },
  memory: getSharedMemory(),
  defaultGenerateOptions: DEFAULT_OPTIONS,
  defaultStreamOptions: DEFAULT_OPTIONS,
});
