import { logger, schemaTask } from '@trigger.dev/sdk/v3';
import { AnalystAgentTaskInputSchema, type AnalystAgentTaskOutput } from './types';

// TODO: Uncomment when Task 2 (database helpers) is implemented
// import {
//   getMessageContext,
//   loadConversationHistory
// } from '@buster/database';

// TODO: Uncomment when workflow integration is ready
// import { RuntimeContext } from '@mastra/core';
// import { analystWorkflow } from '@packages/ai/src/workflows/analyst-workflow';
// import type { AnalystRuntimeContext } from '@packages/ai/src/workflows/analyst-workflow';

/**
 * Simplified Analyst Agent Task
 *
 * TASK 1 STATUS: ✅ COMPLETED - Schema validation implemented
 * TASK 2 STATUS: 🔄 PENDING - Database helpers not yet implemented
 * TASK 3-5 STATUS: 🔄 PENDING - Workflow integration not yet implemented
 *
 * For now, this provides a working task that validates input and returns a placeholder response.
 * Once Tasks 2-5 are complete, the full workflow will be implemented.
 */
export const analystAgentTask = schemaTask({
  id: 'analyst-agent-task',
  schema: AnalystAgentTaskInputSchema,
  maxDuration: 1800, // 30 minutes for complex analysis
  run: async (payload): Promise<AnalystAgentTaskOutput> => {
    const startTime = Date.now();

    try {
      logger.log('Task 1 - Schema validation successful', {
        messageId: payload.message_id,
      });

      // TODO: Task 2 - Implement database context loading
      // const messageContext = await getMessageContext(payload.message_id);

      // TODO: Task 3 - Implement runtime context setup
      // const runtimeContext = setupRuntimeContextFromMessage(messageContext);

      // TODO: Task 4 - Implement conversation history loading
      // const conversationHistory = await loadConversationHistory(messageContext.chat.id);

      // TODO: Task 5 - Implement workflow integration
      // await analystWorkflow.createRun().start({ inputData, runtimeContext });

      logger.log('Task 1 placeholder execution completed', {
        messageId: payload.message_id,
        executionTimeMs: Date.now() - startTime,
      });

      return {
        success: true,
        messageId: payload.message_id,
        result: {
          success: true,
          messageId: payload.message_id,
          executionTimeMs: Date.now() - startTime,
          workflowCompleted: false, // Will be true when Tasks 2-5 are done
        },
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('Task execution failed', {
        messageId: payload.message_id,
        error: errorMessage,
        executionTimeMs: Date.now() - startTime,
      });

      return {
        success: false,
        messageId: payload.message_id,
        error: {
          code: getErrorCode(error),
          message: errorMessage,
          details: {
            operation: 'task_1_schema_validation',
            messageId: payload.message_id,
          },
        },
      };
    }
  },
});

/**
 * Get error code from error object for consistent error handling
 */
function getErrorCode(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === 'ValidationError') return 'VALIDATION_ERROR';
    if (error.message.includes('Message not found')) return 'MESSAGE_NOT_FOUND';
    if (error.message.includes('User organization not found')) return 'USER_CONTEXT_ERROR';
    if (error.message.includes('Organization data source not found')) return 'DATA_SOURCE_ERROR';
    if (error.message.includes('database') || error.message.includes('connection'))
      return 'DATABASE_ERROR';
  }
  return 'UNKNOWN_ERROR';
}
