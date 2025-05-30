import { Agent } from '@mastra/core/agent';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { PostgresStore } from '@mastra/pg';

import { initLogger } from 'braintrust';

import { Memory } from '@mastra/memory';
// Import the analyst mode system
import {
  AnalystMode,
  type AnalystRuntimeContext,
  getAnalystConfiguration,
} from './modes/analyst-base';

initLogger({
  apiKey: process.env.BRAINTRUST_KEY,
  projectName: 'Analyst Agent',
});

const getAnalystInstructions = ({
  runtimeContext,
}: { runtimeContext: RuntimeContext<AnalystRuntimeContext> }) => {
  const { configuration } = getAnalystConfiguration(runtimeContext);
  return configuration.instructions;
};

const getAnalystTools = ({
  runtimeContext,
}: { runtimeContext: RuntimeContext<AnalystRuntimeContext> }) => {
  const { configuration } = getAnalystConfiguration(runtimeContext);
  return configuration.tools;
};

const getAnalystModel = ({
  runtimeContext,
}: { runtimeContext: RuntimeContext<AnalystRuntimeContext> }) => {
  const { configuration } = getAnalystConfiguration(runtimeContext);
  return configuration.model;
};

const DEFAULT_OPTIONS = {
  maxSteps: 18,
  temperature: 1,
  providerOptions: {
    anthropic: {
      thinking: { type: 'enabled', budgetTokens: 5000 },
    },
  },
};

export const analystAgent = new Agent({
  name: 'Analyst Agent',
  instructions: getAnalystInstructions,
  model: getAnalystModel,
  tools: getAnalystTools,
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

export { getAnalystConfiguration, AnalystMode, type AnalystRuntimeContext };
