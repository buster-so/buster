import { schemaTask, logger } from '@trigger.dev/sdk/v3';
import { RuntimeContext } from '@mastra/core';
import { AnalystAgentTaskInputSchema, type AnalystAgentTaskOutput } from './types';
import { 
  getMessageContext,
  loadConversationHistory 
} from '@buster/database';
import { analystWorkflow } from '@packages/ai/src/workflows/analyst-workflow';
import type { AnalystRuntimeContext } from '@packages/ai/src/workflows/analyst-workflow';

/**
 * Simplified Analyst Agent Task
 * 
 * Takes a message_id and executes the analyst workflow:
 * 1. Load message context (includes user, chat, organization, dataSource)
 * 2. Load conversation history for the chat
 * 3. Set up runtime context for the workflow
 * 4. Execute the analyst workflow
 * 
 * The web server handles all setup (authentication, chat creation, message creation, asset loading)
 * This task only executes the workflow with the provided context.
 */
export const analystAgentTask = schemaTask({
  id: 'analyst-agent-task',
  schema: AnalystAgentTaskInputSchema,
  maxDuration: 1800, // 30 minutes for complex analysis
  run: async (payload): Promise<AnalystAgentTaskOutput> => {
    const startTime = Date.now();
    
    try {
      logger.log('Starting analyst workflow execution', {
        messageId: payload.message_id
      });
      
      // 1. Load message context (includes all user/chat/org/dataSource info)
      const messageContext = await getMessageContext(payload.message_id);
      
      logger.log('Message context loaded', {
        messageId: payload.message_id,
        userId: messageContext.user.id,
        chatId: messageContext.chat.id,
        organizationId: messageContext.organization.id,
        dataSourceType: messageContext.dataSource.type
      });
      
      // 2. Load conversation history for the chat
      const conversationHistory = await loadConversationHistory(messageContext.chat.id);
      
      logger.log('Conversation history loaded', {
        messageId: payload.message_id,
        chatId: messageContext.chat.id,
        historyLength: conversationHistory.length
      });
      
      // 3. Set up runtime context for the workflow
      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      runtimeContext.set('userId', messageContext.user.id);
      runtimeContext.set('threadId', messageContext.chat.id);
      runtimeContext.set('organizationId', messageContext.organization.id);
      runtimeContext.set('dataSourceId', messageContext.dataSource.id);
      runtimeContext.set('dataSourceSyntax', messageContext.dataSource.type);
      runtimeContext.set('todos', ''); // Initialize as empty
      
      // 4. Prepare workflow input
      const workflowInput = {
        prompt: messageContext.message.requestMessage,
        conversationHistory: conversationHistory.length > 0 ? conversationHistory : undefined,
      };
      
      // 5. Execute analyst workflow
      logger.log('Executing analyst workflow', {
        messageId: payload.message_id,
        hasPrompt: !!workflowInput.prompt,
        hasConversationHistory: !!workflowInput.conversationHistory,
        runtimeContext: {
          userId: messageContext.user.id,
          threadId: messageContext.chat.id,
          organizationId: messageContext.organization.id,
          dataSourceId: messageContext.dataSource.id,
          dataSourceSyntax: messageContext.dataSource.type,
        }
      });
      
      await analystWorkflow.createRun().start({
        inputData: workflowInput,
        runtimeContext
      });
      
      logger.log('Analyst workflow completed successfully', {
        messageId: payload.message_id,
        executionTimeMs: Date.now() - startTime
      });
      
      return {
        success: true,
        messageId: payload.message_id,
        result: {
          success: true,
          messageId: payload.message_id,
          executionTimeMs: Date.now() - startTime,
          workflowCompleted: true,
        }
      };
      
    } catch (error) {
      logger.error('Analyst workflow execution failed', {
        messageId: payload.message_id,
        error: error.message,
        stack: error.stack,
        executionTimeMs: Date.now() - startTime
      });
      
      return {
        success: false,
        messageId: payload.message_id,
        error: {
          code: getErrorCode(error),
          message: error.message,
          details: { 
            operation: 'analyst_workflow_execution',
            messageId: payload.message_id
          }
        }
      };
    }
  },
});

/**
 * Get error code from error object for consistent error handling
 */
function getErrorCode(error: any): string {
  if (error.name === 'ValidationError') return 'VALIDATION_ERROR';
  if (error.message.includes('Message not found')) return 'MESSAGE_NOT_FOUND';
  if (error.message.includes('User organization not found')) return 'USER_CONTEXT_ERROR';
  if (error.message.includes('Organization data source not found')) return 'DATA_SOURCE_ERROR';
  if (error.message.includes('database') || error.message.includes('connection')) return 'DATABASE_ERROR';
  return 'WORKFLOW_EXECUTION_ERROR';
}
