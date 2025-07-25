import {} from '@ai-sdk/anthropic';
import { Agent } from '@mastra/core';
import {
  createDashboards,
  createMetrics,
  doneTool,
  modifyDashboards,
  modifyMetrics,
} from '../../tools';
import { Sonnet4 } from '../../utils/models/sonnet-4';

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
  instructions: '', // We control the system messages in the step at stream instantiation
  model: Sonnet4,
  tools: {
    createMetrics,
    modifyMetrics,
    createDashboards,
    modifyDashboards,
    doneTool,
  },
  defaultGenerateOptions: DEFAULT_OPTIONS,
  defaultStreamOptions: DEFAULT_OPTIONS,
});
