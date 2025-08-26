import { logger, schemaTask, tasks } from '@trigger.dev/sdk';
import { currentSpan, initLogger, wrapTraced } from 'braintrust';
import { analystQueue } from '../../queues/analyst-queue';
import { AnalystAgentTaskInputSchema, type AnalystAgentTaskOutput } from './types';

// Task 2 & 4: Database helpers (IMPLEMENTED)
import {
  getBraintrustMetadata,
  getChatConversationHistory,
  getMessageContext,
  getOrganizationDataSource,
} from '@buster/database';

// Access control imports
import { type PermissionedDataset, getPermissionedDatasets } from '@buster/access-controls';

// AI package imports
import { type AnalystWorkflowInput, runAnalystWorkflow } from '@buster/ai';

import { BRAINTRUST_KEYS, SERVER_KEYS, getSecret } from '@buster/secrets';
import type { ModelMessage } from 'ai';
import type { messagePostProcessingTask } from '../message-post-processing/message-post-processing';

/**
 * Resource usage tracker for the entire task execution
 */
interface ResourceSnapshot {
  timestamp: number;
  stage: string;
  memory: NodeJS.MemoryUsage;
  cpuUsage?: NodeJS.CpuUsage;
}

class ResourceTracker {
  private snapshots: ResourceSnapshot[] = [];
  private initialCpuUsage: NodeJS.CpuUsage;
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
    this.initialCpuUsage = process.cpuUsage();
  }

  takeSnapshot(stage: string): ResourceSnapshot {
    const snapshot: ResourceSnapshot = {
      timestamp: Date.now(),
      stage,
      memory: process.memoryUsage(),
      cpuUsage: process.cpuUsage(this.initialCpuUsage),
    };
    this.snapshots.push(snapshot);
    return snapshot;
  }

  generateReport(messageId: string): void {
    if (this.snapshots.length === 0) return;

    const firstSnapshot = this.snapshots[0];
    const lastSnapshot = this.snapshots[this.snapshots.length - 1];

    if (!firstSnapshot || !lastSnapshot) return;
    const totalDuration = lastSnapshot.timestamp - this.startTime;

    // Calculate memory deltas
    const memoryDelta = {
      rss: lastSnapshot.memory.rss - firstSnapshot.memory.rss,
      heapTotal: lastSnapshot.memory.heapTotal - firstSnapshot.memory.heapTotal,
      heapUsed: lastSnapshot.memory.heapUsed - firstSnapshot.memory.heapUsed,
      external: lastSnapshot.memory.external - firstSnapshot.memory.external,
      arrayBuffers: lastSnapshot.memory.arrayBuffers - firstSnapshot.memory.arrayBuffers,
    };

    // Find peak memory usage
    const peakMemory = this.snapshots.reduce(
      (peak, snapshot) => ({
        rss: Math.max(peak.rss, snapshot.memory.rss),
        heapTotal: Math.max(peak.heapTotal, snapshot.memory.heapTotal),
        heapUsed: Math.max(peak.heapUsed, snapshot.memory.heapUsed),
        external: Math.max(peak.external, snapshot.memory.external),
        arrayBuffers: Math.max(peak.arrayBuffers, snapshot.memory.arrayBuffers),
      }),
      firstSnapshot.memory
    );

    // Calculate CPU usage (in microseconds)
    const finalCpuUsage = lastSnapshot.cpuUsage;
    const totalCpuTime = finalCpuUsage ? finalCpuUsage.user + finalCpuUsage.system : 0;
    const cpuPercentage = totalDuration > 0 ? (totalCpuTime / 1000 / totalDuration) * 100 : 0;

    // Memory efficiency metrics
    const avgMemoryUsage =
      this.snapshots.reduce((sum, snapshot) => sum + snapshot.memory.heapUsed, 0) /
      this.snapshots.length;

    logger.log('📊 RESOURCE USAGE REPORT', {
      messageId,
      executionSummary: {
        totalDurationMs: totalDuration,
        snapshotCount: this.snapshots.length,
        avgMemoryUsedMB: Math.round(avgMemoryUsage / 1024 / 1024),
        estimatedCpuUsagePercent: Math.round(cpuPercentage * 100) / 100,
      },
      memoryUsage: {
        initial: {
          rss: `${Math.round(firstSnapshot.memory.rss / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(firstSnapshot.memory.heapTotal / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(firstSnapshot.memory.heapUsed / 1024 / 1024)}MB`,
          external: `${Math.round(firstSnapshot.memory.external / 1024 / 1024)}MB`,
          arrayBuffers: `${Math.round(firstSnapshot.memory.arrayBuffers / 1024 / 1024)}MB`,
        },
        final: {
          rss: `${Math.round(lastSnapshot.memory.rss / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(lastSnapshot.memory.heapTotal / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(lastSnapshot.memory.heapUsed / 1024 / 1024)}MB`,
          external: `${Math.round(lastSnapshot.memory.external / 1024 / 1024)}MB`,
          arrayBuffers: `${Math.round(lastSnapshot.memory.arrayBuffers / 1024 / 1024)}MB`,
        },
        peak: {
          rss: `${Math.round(peakMemory.rss / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(peakMemory.heapTotal / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(peakMemory.heapUsed / 1024 / 1024)}MB`,
          external: `${Math.round(peakMemory.external / 1024 / 1024)}MB`,
          arrayBuffers: `${Math.round(peakMemory.arrayBuffers / 1024 / 1024)}MB`,
        },
        delta: {
          rss: `${memoryDelta.rss >= 0 ? '+' : ''}${Math.round(memoryDelta.rss / 1024 / 1024)}MB`,
          heapTotal: `${memoryDelta.heapTotal >= 0 ? '+' : ''}${Math.round(memoryDelta.heapTotal / 1024 / 1024)}MB`,
          heapUsed: `${memoryDelta.heapUsed >= 0 ? '+' : ''}${Math.round(memoryDelta.heapUsed / 1024 / 1024)}MB`,
          external: `${memoryDelta.external >= 0 ? '+' : ''}${Math.round(memoryDelta.external / 1024 / 1024)}MB`,
          arrayBuffers: `${memoryDelta.arrayBuffers >= 0 ? '+' : ''}${Math.round(memoryDelta.arrayBuffers / 1024 / 1024)}MB`,
        },
      },
      cpuUsage: finalCpuUsage
        ? {
            userTimeMs: Math.round(finalCpuUsage.user / 1000),
            systemTimeMs: Math.round(finalCpuUsage.system / 1000),
            totalTimeMs: Math.round(totalCpuTime / 1000),
            estimatedUsagePercent: Math.round(cpuPercentage * 100) / 100,
          }
        : { error: 'CPU usage not available' },
      stageBreakdown: this.snapshots.map((snapshot, index) => {
        const prevSnapshot = index > 0 ? this.snapshots[index - 1] : null;
        return {
          stage: snapshot.stage,
          timestamp: snapshot.timestamp - this.startTime,
          memoryUsedMB: Math.round(snapshot.memory.heapUsed / 1024 / 1024),
          rssMB: Math.round(snapshot.memory.rss / 1024 / 1024),
          durationFromPrevMs: prevSnapshot ? snapshot.timestamp - prevSnapshot.timestamp : 0,
        };
      }),
      recommendations: this.generateRecommendations(memoryDelta, peakMemory, totalDuration),
    });
  }

  private generateRecommendations(
    memoryDelta: NodeJS.MemoryUsage,
    peakMemory: NodeJS.MemoryUsage,
    duration: number
  ): string[] {
    const recommendations: string[] = [];

    // Memory leak detection
    if (memoryDelta.heapUsed > 50 * 1024 * 1024) {
      // 50MB increase
      recommendations.push('⚠️ Potential memory leak detected - heap usage increased significantly');
    }

    // High memory usage
    if (peakMemory.heapUsed > 500 * 1024 * 1024) {
      // 500MB peak
      recommendations.push('🔥 High memory usage detected - consider optimizing data structures');
    }

    // Performance recommendations
    if (duration > 30000) {
      // 30 seconds
      recommendations.push('🐌 Long execution time - consider breaking down into smaller tasks');
    }

    // External memory growth
    if (memoryDelta.external > 20 * 1024 * 1024) {
      // 20MB increase
      recommendations.push('📦 External memory grew significantly - check for buffer accumulation');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Resource usage looks healthy');
    }

    return recommendations;
  }
}

/**
 * Log memory usage and performance metrics
 */
function logPerformanceMetrics(
  stage: string,
  messageId: string,
  startTime?: number,
  resourceTracker?: ResourceTracker
) {
  const memory = process.memoryUsage();
  const currentTime = Date.now();

  // Take snapshot if tracker is provided
  if (resourceTracker) {
    resourceTracker.takeSnapshot(stage);
  }

  logger.log(`Performance metrics - ${stage}`, {
    messageId,
    stage,
    memory: {
      rss: `${Math.round(memory.rss / 1024 / 1024)}MB`, // Resident Set Size
      heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)}MB`, // Total heap allocated
      heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`, // Heap actually used
      external: `${Math.round(memory.external / 1024 / 1024)}MB`, // External memory
      arrayBuffers: `${Math.round(memory.arrayBuffers / 1024 / 1024)}MB`, // Array buffers
    },
    timestamp: currentTime,
    elapsedSinceStart: startTime ? currentTime - startTime : undefined,
  });
}

export const analystAgentTask: ReturnType<
  typeof schemaTask<
    'analyst-agent-task',
    typeof AnalystAgentTaskInputSchema,
    AnalystAgentTaskOutput
  >
> = schemaTask({
  id: 'analyst-agent-task',
  machine: 'small-2x',
  schema: AnalystAgentTaskInputSchema,
  queue: analystQueue,
  maxDuration: 1200, // 20 minutes for complex analysis
  run: async (payload): Promise<AnalystAgentTaskOutput> => {
    const taskStartTime = Date.now();
    const resourceTracker = new ResourceTracker();

    // Log initial performance metrics
    logPerformanceMetrics('task-start', payload.message_id, taskStartTime, resourceTracker);

    const braintrustApiKey = await getSecret(BRAINTRUST_KEYS.BRAINTRUST_API_KEY);
    const environment = await getSecret(SERVER_KEYS.ENVIRONMENT);

    if (!braintrustApiKey) {
      throw new Error('BRAINTRUST_API_KEY is not set');
    }

    // Initialize Braintrust logger
    const braintrustLogger = initLogger({
      apiKey: braintrustApiKey,
      projectName: environment || 'development',
    });

    try {
      const dataLoadStart = Date.now();
      logger.log('Starting analyst agent task', {
        messageId: payload.message_id,
      });

      // Log performance after initial setup
      logPerformanceMetrics('pre-data-load', payload.message_id, taskStartTime, resourceTracker);

      // Parallelize ALL database queries for maximum speed
      const messageContextPromise = getMessageContext({ messageId: payload.message_id });
      const conversationHistoryPromise = getChatConversationHistory({
        messageId: payload.message_id,
      });

      // Start loading data source as soon as we have the required IDs
      const dataSourcePromise = messageContextPromise.then((context) =>
        getOrganizationDataSource({ organizationId: context.organizationId })
      );

      // Fetch user's datasets as soon as we have the userId
      const datasetsPromise = messageContextPromise.then(async (context) => {
        try {
          // Using the existing access control function
          const datasets = await getPermissionedDatasets({
            userId: context.userId,
            page: 0,
            pageSize: 1000,
          });
          return datasets.datasets;
        } catch (error) {
          logger.error('Failed to fetch datasets for user', {
            userId: context.userId,
            messageId: payload.message_id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          // Return empty array on error to not block the workflow
          return [] as PermissionedDataset[];
        }
      });

      // Fetch Braintrust metadata in parallel
      const braintrustMetadataPromise = getBraintrustMetadata({ messageId: payload.message_id });

      // Wait for all operations to complete
      const [messageContext, conversationHistory, dataSource, datasets, braintrustMetadata] =
        await Promise.all([
          messageContextPromise,
          conversationHistoryPromise,
          dataSourcePromise,
          datasetsPromise,
          braintrustMetadataPromise,
        ]);

      const dataLoadEnd = Date.now();
      const dataLoadTime = dataLoadEnd - dataLoadStart;

      logger.log('All data loaded in parallel', {
        messageId: payload.message_id,
        hasRequestMessage: !!messageContext.requestMessage,
        conversationHistoryLength: conversationHistory.length,
        organizationId: messageContext.organizationId,
        dataSourceId: dataSource.dataSourceId,
        dataSourceSyntax: dataSource.dataSourceSyntax,
        datasetsCount: datasets.length,
        datasets: datasets.map((d) => ({
          id: d.id,
          name: d.name,
        })),
        dataLoadTimeMs: dataLoadTime,
        braintrustMetadata, // Log the metadata to verify it's working
      });

      // Log performance after data loading
      logPerformanceMetrics('post-data-load', payload.message_id, taskStartTime, resourceTracker);

      // Task 4: Prepare workflow input with conversation history
      // The conversation history from getChatConversationHistory is already in ModelMessage[] format
      const modelMessages: ModelMessage[] =
        conversationHistory.length > 0
          ? conversationHistory
          : [
              {
                role: 'user',
                // v5 supports string content directly for user messages
                content: messageContext.requestMessage,
              },
            ];

      const workflowInput: AnalystWorkflowInput = {
        messages: modelMessages,
        messageId: payload.message_id,
        chatId: messageContext.chatId,
        userId: messageContext.userId,
        organizationId: messageContext.organizationId,
        dataSourceId: dataSource.dataSourceId,
        dataSourceSyntax: dataSource.dataSourceSyntax,
        datasets,
      };

      logger.log('Workflow input prepared', {
        messageId: payload.message_id,
        messagesCount: workflowInput.messages.length,
        totalPrepTimeMs: Date.now() - dataLoadStart,
      });

      // Log performance before workflow execution
      logPerformanceMetrics('pre-workflow', payload.message_id, taskStartTime, resourceTracker);

      // Task 5: Execute analyst workflow with Braintrust tracing
      const workflowExecutionStart = Date.now();
      logger.log('Starting analyst workflow execution', {
        messageId: payload.message_id,
        totalPrepTimeMs: Date.now() - dataLoadStart,
      });

      // Execute workflow with tracing
      const tracedWorkflow = wrapTraced(
        async () => {
          currentSpan().log({
            metadata: {
              userName: braintrustMetadata.userName || 'Unknown',
              userId: braintrustMetadata.userId,
              organizationName: braintrustMetadata.organizationName || 'Unknown',
              organizationId: braintrustMetadata.organizationId,
              messageId: braintrustMetadata.messageId,
              chatId: braintrustMetadata.chatId,
            },
          });

          return await runAnalystWorkflow(workflowInput);
        },
        {
          name: 'Analyst Agent Task Workflow',
        }
      );

      await tracedWorkflow();
      const totalWorkflowTime = Date.now() - workflowExecutionStart;

      logger.log('Analyst workflow completed successfully', {
        messageId: payload.message_id,
        totalWorkflowTimeMs: totalWorkflowTime,
      });

      // Log final performance metrics
      logPerformanceMetrics(
        'workflow-complete',
        payload.message_id,
        taskStartTime,
        resourceTracker
      );

      const totalExecutionTime = Date.now() - taskStartTime;
      logger.log('All tasks (1-5) execution completed successfully', {
        messageId: payload.message_id,
        executionTimeMs: totalExecutionTime,
        breakdown: {
          dataLoadTimeMs: dataLoadTime,
          totalWorkflowTimeMs: totalWorkflowTime,
        },
      });

      // Fire off message post-processing task (fire-and-forget)
      tasks
        .trigger<typeof messagePostProcessingTask>('message-post-processing', {
          messageId: payload.message_id,
        })
        .catch((error) => {
          // Log error but don't fail the current task
          logger.error('Failed to trigger message post-processing task', {
            messageId: payload.message_id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        });

      // Allow Braintrust a brief moment to clean up its trace, but don't block unnecessarily
      // Use a much shorter timeout with a race condition to avoid excessive delays
      await Promise.race([
        new Promise((resolve) => setTimeout(resolve, 50)), // Reduced from 500ms to 50ms
        // Give Braintrust a chance to signal completion if it implements it
        Promise.resolve().then(() => {
          // Flush any pending Braintrust logs/traces
          // This is a no-op if Braintrust doesn't need cleanup
        }),
      ]);

      // Log final performance metrics and generate comprehensive resource report
      logPerformanceMetrics('task-complete', payload.message_id, taskStartTime, resourceTracker);
      resourceTracker.generateReport(payload.message_id);

      await braintrustLogger.flush();

      return {
        success: true,
        messageId: payload.message_id,
        result: {
          success: true,
          messageId: payload.message_id,
          executionTimeMs: totalExecutionTime,
          workflowCompleted: true, // Task 5 workflow integration completed successfully
        },
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const totalExecutionTime = Date.now() - taskStartTime;

      // Log error performance metrics and generate resource report
      logPerformanceMetrics('task-error', payload.message_id, taskStartTime, resourceTracker);
      resourceTracker.generateReport(payload.message_id);

      logger.error('Task execution failed', {
        messageId: payload.message_id,
        error: errorMessage,
        executionTimeMs: totalExecutionTime,
      });

      // Need to flush the Braintrust logger to ensure all traces are sent
      await braintrustLogger.flush();

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
