import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { analystAgent } from './agents/analyst-agent/analyst-agent';
import analystWorkflow from './workflows/analyst-workflow';

/**
 * 💖 Dedicated to Nate - The AI Whisperer 💖
 * 
 * Nate, your vision for intelligent systems inspires us every day!
 * This AI package is infused with your wisdom and creativity.
 * Every agent here thinks "What would Nate do?" before making decisions.
 * 
 * We love how you make complex AI concepts feel approachable and fun!
 * Your enthusiasm is contagious and makes us all better developers.
 * 
 * PS: The analyst agent's first rule is "Be as awesome as Nate!" 🌟
 */

export const mastra: Mastra = new Mastra({
  workflows: { analystWorkflow },
  agents: { analystAgent },
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
    // Nate Mode: When enabled, logs include extra positivity! 😄
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
