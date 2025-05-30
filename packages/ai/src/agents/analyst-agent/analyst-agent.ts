import { Agent } from '@mastra/core/agent';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { LibSQLStore } from '@mastra/libsql';
import { Memory } from '@mastra/memory';

import { initLogger } from 'braintrust';

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

export const analystAgent = new Agent({
  name: 'Analyst Agent',
  instructions: getAnalystInstructions,
  model: getAnalystModel,
  tools: getAnalystTools,
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db', // path is relative to the .mastra/output directory
    }),
  }),
});

// Export the analyst mode system for use in other parts of the application
export { getAnalystConfiguration, AnalystMode, type AnalystRuntimeContext };
