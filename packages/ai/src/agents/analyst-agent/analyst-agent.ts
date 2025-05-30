import { Agent } from '@mastra/core/agent';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { LibSQLStore } from '@mastra/libsql';
import { Memory } from '@mastra/memory';

import { initLogger } from 'braintrust';

// Import the new mode system
import { AgentMode, type ModeRuntimeContext, getAgentConfiguration } from './modes/base';

initLogger({
  apiKey: process.env.BRAINTRUST_KEY,
  projectName: 'Analyst Agent',
});

interface AnalysisModeRuntimeContext extends ModeRuntimeContext {
  // Additional fields specific to this agent if needed
}

const analysisModeInstructions = ({
  runtimeContext,
}: { runtimeContext: RuntimeContext<AnalysisModeRuntimeContext> }) => {
  // Use the new mode system to get instructions
  const { configuration } = getAgentConfiguration(runtimeContext);
  return configuration.instructions;
};

const analysisModeTools = ({
  runtimeContext,
}: { runtimeContext: RuntimeContext<AnalysisModeRuntimeContext> }) => {
  // Use the new mode system to get tools
  const { configuration } = getAgentConfiguration(runtimeContext);
  return configuration.tools;
};

const analysisModeModel = ({
  runtimeContext,
}: { runtimeContext: RuntimeContext<AnalysisModeRuntimeContext> }) => {
  // Use the new mode system to get model
  const { configuration } = getAgentConfiguration(runtimeContext);
  return configuration.model;
};

export const analystAgent = new Agent({
  name: 'Analyst Agent',
  instructions: analysisModeInstructions,
  model: analysisModeModel,
  tools: analysisModeTools,
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db', // path is relative to the .mastra/output directory
    }),
  }),
});

// Export the mode system for use in other parts of the application
export { getAgentConfiguration, AgentMode, type ModeRuntimeContext };
