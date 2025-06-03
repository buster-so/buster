import { Agent } from '@mastra/core';
import { Memory } from '@mastra/memory';
import { PostgresStore } from '@mastra/pg';
import { wrapAISDKModel } from 'braintrust';
import { doneTool, executeSqlStatementTool, sequentialThinkingTool } from '../../tools';
import submitThoughtsTool from '../../tools/communication-tools/submit-thoughts-tool';
import { anthropicCachedModel } from '../../utils/models/anthropic-cached';
import { getThinkAndPrepInstructions } from './think-and-prep-instructions';

const DEFAULT_OPTIONS = {
  maxSteps: 18,
  temperature: 0,
  maxTokens: 10000,
};

export const thinkAndPrepAgent = new Agent({
  name: 'Think and Prep Agent',
  instructions: getThinkAndPrepInstructions,
  model: wrapAISDKModel(anthropicCachedModel('claude-sonnet-4-20250514')),
  tools: {
    sequentialThinkingTool,
    executeSqlStatementTool,
    doneTool,
    submitThoughtsTool,
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
