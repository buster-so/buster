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

const DEFAULT_OPTIONS = {
  maxSteps: 18,
  temperature: 0,
  maxTokens: 10000,
};

export const anthropicCachedModel = wrapAISDKModel(
  createAnthropic({
    fetch: ((url, options) => {
      if (options?.body) {
        try {
          // Parse existing body if it's a string
          const existingBody =
            typeof options.body === 'string' ? JSON.parse(options.body) : options.body;

          // Append cache_control to system messages
          const modifiedBody = {
            ...existingBody,
          };

          if (modifiedBody.system && Array.isArray(modifiedBody.system)) {
            modifiedBody.system = modifiedBody.system.map((systemMessage: any) => ({
              ...systemMessage,
              cache_control: { type: 'ephemeral' },
            }));
          }

          // Return modified options
          return fetch(url, {
            ...options,
            body: JSON.stringify(modifiedBody),
          });
        } catch (error) {
          // If body parsing fails, fall back to original request
          console.warn('Failed to parse request body:', error);
          return fetch(url, options);
        }
      }

      return fetch(url, options);
    }) as typeof fetch,
  })
);

export const analystAgent = new Agent({
  name: 'Analyst Agent',
  instructions: getAnalystInstructions,
  model: wrapAISDKModel(anthropic('claude-sonnet-4-20250514')),
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
