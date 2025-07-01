import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { analystAgent } from './agents/analyst-agent/analyst-agent';
import analystWorkflow from './workflows/analyst-workflow';

export const mastra: Mastra = new Mastra({
  workflows: { analystWorkflow },
  agents: { analystAgent },
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});

// Export agents
export { analystAgent } from './agents/analyst-agent/analyst-agent';
export { thinkAndPrepAgent } from './agents/think-and-prep-agent/think-and-prep-agent';

// Export workflows
export {
  default as analystWorkflow,
  type AnalystRuntimeContext,
} from './workflows/analyst-workflow';

// Export schemas
export {
  type DashboardFileContext,
  DashboardFileContextSchema,
} from './schemas/workflow-schemas';

// Export chat history utilities
export {
  getChatHistory,
  getRawLlmMessages,
  getRawLlmMessagesByMessageId,
} from './steps/get-chat-history';
