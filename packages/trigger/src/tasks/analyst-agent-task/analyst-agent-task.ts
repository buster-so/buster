import '../../env';
import { logger, schemaTask } from '@trigger.dev/sdk/v3';
import { initLogger, wrapTraced } from 'braintrust';
import { AnalystAgentTaskInputSchema, type AnalystAgentTaskOutput } from './types';

// Task 2 & 4: Database helpers (IMPLEMENTED)
import {
  getChatConversationHistory,
  getMessageContext,
  getOrganizationDataSource,
} from '@buster/database';

import { type AnalystRuntimeContext, analystWorkflow } from '@buster/ai';

// Mastra workflow integration
import { RuntimeContext } from '@mastra/core/runtime-context';

// Task 3: Runtime Context Setup Function
// Database helper output types
import type { MessageContextOutput, OrganizationDataSourceOutput } from '@buster/database';

/**
 * Task 3: Setup runtime context from Task 2 database helper outputs
 * Uses individual helper results to populate Mastra RuntimeContext
 */
function setupRuntimeContextFromMessage(
  messageContext: MessageContextOutput,
  dataSource: OrganizationDataSourceOutput,
  messageId: string
): RuntimeContext<AnalystRuntimeContext> {
  try {
    const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();

    // Populate from Task 2 helper outputs
    runtimeContext.set('userId', messageContext.userId);
    runtimeContext.set('chatId', messageContext.chatId);
    runtimeContext.set('organizationId', messageContext.organizationId);
    runtimeContext.set('dataSourceId', dataSource.dataSourceId);
    runtimeContext.set('dataSourceSyntax', dataSource.dataSourceSyntax);
    runtimeContext.set('workflowStartTime', Date.now());

    // Add messageId for database persistence (following AI package pattern)
    runtimeContext.set('messageId', messageId);

    return runtimeContext;
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error(`Failed to setup runtime context: ${String(error)}`);
  }
}

/**
 * Simplified Analyst Agent Task
 *
 * TASK 1 STATUS: ✅ COMPLETED - Schema validation implemented
 * TASK 2 STATUS: ✅ COMPLETED - Database helpers implemented in @buster/database
 * TASK 3 STATUS: ✅ COMPLETED - Runtime context setup function implemented
 * TASK 4 STATUS: ✅ COMPLETED - Chat history loading using getChatConversationHistory
 * TASK 5 STATUS: ✅ COMPLETED - Workflow integration enabled and functional
 *
 * All tasks 1-5 are fully implemented and integrated. Workflow integration is complete and functional.
 */
//@ts-ignore
export const analystAgentTask: ReturnType<
  typeof schemaTask<
    'analyst-agent-task',
    typeof AnalystAgentTaskInputSchema,
    AnalystAgentTaskOutput
  >
> = schemaTask({
  id: 'analyst-agent-task',
  schema: AnalystAgentTaskInputSchema,
  maxDuration: 1800, // 30 minutes for complex analysis
  run: async (payload): Promise<AnalystAgentTaskOutput> => {
    const startTime = Date.now();

    if (!process.env.BRAINTRUST_KEY) {
      throw new Error('BRAINTRUST_KEY is not set');
    }

    // Initialize Braintrust logging for observability
    initLogger({
      apiKey: process.env.BRAINTRUST_KEY,
      projectName: process.env.ENVIRONMENT || 'development',
    });

    try {
      logger.log('Starting analyst agent task', {
        messageId: payload.message_id,
      });

      // Task 2 & 4: Load message context and conversation history concurrently
      const [messageContext, conversationHistory] = await Promise.all([
        getMessageContext({ messageId: payload.message_id }),
        getChatConversationHistory({ messageId: payload.message_id }),
      ]);

      logger.log('Context and history loaded', {
        messageId: payload.message_id,
        hasRequestMessage: !!messageContext.requestMessage,
        conversationHistoryLength: conversationHistory.length,
        organizationId: messageContext.organizationId,
      });

      // Task 2: Load data source using organizationId from message context
      const dataSource = await getOrganizationDataSource({
        organizationId: messageContext.organizationId,
      });

      logger.log('Data source loaded', {
        messageId: payload.message_id,
        dataSourceId: dataSource.dataSourceId,
        dataSourceSyntax: dataSource.dataSourceSyntax,
      });

      // Task 3: Setup runtime context for workflow execution
      const runtimeContext = setupRuntimeContextFromMessage(
        messageContext,
        dataSource,
        payload.message_id
      );

      // Task 4: Prepare workflow input with conversation history
      const workflowInput = {
        prompt: messageContext.requestMessage,
        conversationHistory: conversationHistory.length > 0 ? conversationHistory : undefined,
      };

      logger.log('Workflow input prepared', {
        messageId: payload.message_id,
        hasPrompt: !!workflowInput.prompt,
        hasConversationHistory: !!workflowInput.conversationHistory,
        conversationHistoryLength: workflowInput.conversationHistory?.length || 0,
      });

      // Task 5: Execute analyst workflow with Braintrust tracing
      logger.log('Starting analyst workflow execution', {
        messageId: payload.message_id,
      });

      const tracedWorkflow = wrapTraced(
        async () => {
          const run = analystWorkflow.createRun();
          return await run.start({
            inputData: workflowInput,
            runtimeContext,
          });
        },
        {
          name: 'Analyst Agent Task Workflow',
        }
      );

      const workflowResult = await tracedWorkflow();

      logger.log('Analyst workflow completed successfully', {
        messageId: payload.message_id,
        workflowResult: !!workflowResult,
      });

      logger.log('All tasks (1-5) execution completed successfully', {
        messageId: payload.message_id,
        executionTimeMs: Date.now() - startTime,
      });

      // Wait 250ms to allow Braintrust to clean up its trace before completing
      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        success: true,
        messageId: payload.message_id,
        result: {
          success: true,
          messageId: payload.message_id,
          executionTimeMs: Date.now() - startTime,
          workflowCompleted: true, // Task 5 workflow integration completed successfully
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
            operation: 'analyst_agent_task_execution',
            messageId: payload.message_id,
          },
        },
      };
    }
  },
});
//as unknown as ReturnType<typeof schemaTask>

/**
 * Get error code from error object for consistent error handling
 * Updated for all Tasks 1-5 error patterns
 */
function getErrorCode(error: unknown): string {
  if (error instanceof Error) {
    // Task 1: Schema validation errors
    if (error.name === 'ValidationError') return 'VALIDATION_ERROR';

    // Task 2: Database helper errors
    if (error.message.includes('Message not found')) return 'MESSAGE_NOT_FOUND';
    if (error.message.includes('Message is missing required prompt content'))
      return 'INVALID_MESSAGE_STATE';
    if (error.message.includes('No data sources found')) return 'DATA_SOURCE_NOT_FOUND';
    if (error.message.includes('Multiple data sources found')) return 'MULTIPLE_DATA_SOURCES_ERROR';
    if (error.message.includes('Database query failed')) return 'DATABASE_ERROR';
    if (error.message.includes('Output validation failed')) return 'DATA_VALIDATION_ERROR';

    // Task 3: Runtime context errors
    if (error.message.includes('Failed to setup runtime context')) return 'RUNTIME_CONTEXT_ERROR';

    // Task 5: Workflow execution errors
    if (error.message.includes('workflow') || error.message.includes('Workflow'))
      return 'WORKFLOW_EXECUTION_ERROR';
    if (error.message.includes('RuntimeContext') || error.message.includes('runtime context'))
      return 'RUNTIME_CONTEXT_ERROR';
    if (error.message.includes('agent') || error.message.includes('Agent'))
      return 'AGENT_EXECUTION_ERROR';
    if (error.message.includes('step') || error.message.includes('Step'))
      return 'WORKFLOW_STEP_ERROR';

    // General database and connection errors
    if (error.message.includes('database') || error.message.includes('connection'))
      return 'DATABASE_ERROR';
  }
  return 'UNKNOWN_ERROR';
}
