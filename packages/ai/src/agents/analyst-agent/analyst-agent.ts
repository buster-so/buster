import { anthropic, createAnthropic } from '@ai-sdk/anthropic';
import { Agent } from '@mastra/core';
import { Memory } from '@mastra/memory';
import { PostgresStore } from '@mastra/pg';
import { wrapAISDKModel } from 'braintrust';
import {
  createDashboardsFileTool,
  createMetricsFileTool,
  doneTool,
  modifyDashboardsFileTool,
  modifyMetricsFileTool,
} from '../../tools';
import { getAnalystInstructions } from './analyst-agent-instructions';
import { anthropicCachedModel } from '../../utils/models/anthropic-cached';

const DEFAULT_OPTIONS = {
  maxSteps: 18,
  temperature: 0,
  maxTokens: 10000,
};

export const analystAgent = new Agent({
  name: 'Analyst Agent',
  instructions: getAnalystInstructions,
  model: anthropicCachedModel('claude-sonnet-4-20250514'),
  tools: {
    createMetricsFileTool,
    modifyMetricsFileTool,
    createDashboardsFileTool,
    modifyDashboardsFileTool,
    doneTool,
  },
  memory: new Memory({
    storage: new PostgresStore({
      connectionString:
        process.env.DATABASE_URL ||
        (() => {
          throw new Error('DATABASE_URL environment variable is required');
        })(),
      schemaName: 'mastra',
    }),
  }),
  defaultGenerateOptions: DEFAULT_OPTIONS,
  defaultStreamOptions: DEFAULT_OPTIONS,
});
