import {} from '@ai-sdk/anthropic';
import { Agent } from '@mastra/core';
import {
  createDashboards,
  createMetrics,
  doneTool,
  modifyDashboards,
  modifyMetrics,
} from '../../tools';
import { anthropicCachedModel } from '../../utils/models/anthropic-cached';
import { getSharedMemory } from '../../utils/shared-memory';
import { getAnalystInstructions } from './analyst-agent-instructions';

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

export const analystAgent = new Agent({
  name: 'Analyst Agent',
  instructions: getAnalystInstructions,
  model: anthropicCachedModel('claude-sonnet-4-20250514'),
  tools: {
    createMetrics,
    modifyMetrics,
    createDashboards,
    modifyDashboards,
    doneTool,
  },
  memory: getSharedMemory(),
  defaultGenerateOptions: DEFAULT_OPTIONS,
  defaultStreamOptions: DEFAULT_OPTIONS,
});
