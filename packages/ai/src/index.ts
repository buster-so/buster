import './env';
import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore } from '@mastra/libsql';
import { PinoLogger } from '@mastra/loggers';
import { analystAgent } from './agents/analyst-agent/analyst-agent';
import analystWorkflow from './workflows/analyst-workflow';

export const mastra: Mastra = new Mastra({
  workflows: { analystWorkflow },
  agents: { analystAgent },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ':memory:',
  }),
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

// Export chat history utilities
export {
  getChatHistory,
  getRawLlmMessages,
  getRawLlmMessagesByMessageId,
} from './steps/get-chat-history';
