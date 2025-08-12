import {} from '@ai-sdk/anthropic';
import { Agent } from '@mastra/core';
import {
  createDashboards,
  createMetrics,
  createReports,
  doneTool,
  editReports,
  modifyDashboards,
  modifyMetrics,
} from '../../tools';
import { GPT5 } from '../../utils';
import { Sonnet4 } from '../../utils/models/sonnet-4';

const DEFAULT_OPTIONS = {
  maxSteps: 18,
  temperature: 1,
  providerOptions: {
    anthropic: {
      disableParallelToolCalls: true,
    },
    openai: {
      parallelToolCalls: false,
      serviceTier: 'priority',
    },
  },
};

export const analystAgent = new Agent({
  name: 'Analyst Agent',
  instructions: '', // We control the system messages in the step at stream instantiation
  model: GPT5,
  tools: {
    createMetrics,
    modifyMetrics,
    createDashboards,
    modifyDashboards,
    createReports,
    editReports,
    doneTool,
  },
  defaultGenerateOptions: DEFAULT_OPTIONS,
  defaultStreamOptions: DEFAULT_OPTIONS,
});
