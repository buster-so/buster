import {} from '@ai-sdk/anthropic';
import { Agent } from '@mastra/core';
import {
  createDashboardsFileTool,
  createMetricsFileTool,
  doneTool,
  modifyDashboardsFileTool,
  modifyMetricsFileTool,
} from '../../tools';
import { anthropicCachedModel } from '../../utils/models/anthropic-cached';
import { getSharedMemory } from '../../utils/shared-memory';
import { getAnalystInstructions } from './analyst-agent-instructions';

const DEFAULT_OPTIONS = {
  maxSteps: 18,
  temperature: 0,
  maxTokens: 10000,
};

export const analystAgent = new Agent({
  name: 'Analyst Agent',
  instructions: getAnalystInstructions,
  model: anthropicCachedModel('anthropic/claude-sonnet-4'),
  tools: {
    createMetricsFileTool,
    modifyMetricsFileTool,
    createDashboardsFileTool,
    modifyDashboardsFileTool,
    doneTool,
  },
  memory: getSharedMemory(),
  defaultGenerateOptions: DEFAULT_OPTIONS,
  defaultStreamOptions: DEFAULT_OPTIONS,
});
