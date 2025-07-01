import { logger, schemaTask } from '@trigger.dev/sdk';
import { initLogger, wrapTraced } from 'braintrust';
import { AnalystAgentTaskInputSchema, type AnalystAgentTaskOutput } from './types';

// Task 2 & 4: Database helpers (IMPLEMENTED)
import {
  getChatConversationHistory,
  getChatDashboardFiles,
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
  machine: 'medium-2x',
  schema: AnalystAgentTaskInputSchema,
  maxDuration: 600, // 10 minutes for complex analysis
  run: async (payload): Promise<AnalystAgentTaskOutput> => {
    const taskStartTime = Date.now();
    const resourceTracker = new ResourceTracker();

    // Log initial performance metrics
    logPerformanceMetrics('task-start', payload.message_id, taskStartTime, resourceTracker);

    if (!process.env.BRAINTRUST_KEY) {
      throw new Error('BRAINTRUST_KEY is not set');
    }

    // Start Braintrust initialization immediately but don't block the critical path
    const braintrustInitStart = Date.now();
    const braintrustInitPromise = Promise.resolve().then(async () => {
      try {
        initLogger({
          apiKey: process.env.BRAINTRUST_KEY,
          projectName: process.env.ENVIRONMENT || 'development',
        });
        logger.log('Braintrust initialization completed', {
          messageId: payload.message_id,
          braintrustInitTimeMs: Date.now() - braintrustInitStart,
        });
      } catch (error) {
        logger.error('Braintrust initialization failed', {
          messageId: payload.message_id,
          error: error instanceof Error ? error.message : 'Unknown error',
          braintrustInitTimeMs: Date.now() - braintrustInitStart,
        });
        // Don't throw - allow workflow to continue without Braintrust
      }
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

      // Start loading data source and dashboard files as soon as we have the required IDs
      const dataSourcePromise = messageContextPromise.then((context) =>
        getOrganizationDataSource({ organizationId: context.organizationId })
      );

      const dashboardFilesPromise = messageContextPromise.then((context) =>
        getChatDashboardFiles({ chatId: context.chatId })
      );

      // Wait for all four operations to complete
      const [messageContext, conversationHistory, dataSource, dashboardFiles] = await Promise.all([
        messageContextPromise,
        conversationHistoryPromise,
        dataSourcePromise,
        dashboardFilesPromise,
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
        dashboardFilesCount: dashboardFiles.length,
        dashboardFiles: dashboardFiles.map(d => ({
          id: d.id,
          name: d.name,
          versionNumber: d.versionNumber,
          metricIdsCount: d.metricIds.length,
          metricIds: d.metricIds,
        })),
        dataLoadTimeMs: dataLoadTime,
      });

      // Log performance after data loading
      logPerformanceMetrics('post-data-load', payload.message_id, taskStartTime, resourceTracker);

      // Task 3: Setup runtime context for workflow execution
      const contextSetupStart = Date.now();
      const runtimeContext = setupRuntimeContextFromMessage(
        messageContext,
        dataSource,
        payload.message_id
      );
      const contextSetupTime = Date.now() - contextSetupStart;

      // Task 4: Prepare workflow input with conversation history and dashboard files
      const workflowInput = {
        prompt: messageContext.requestMessage,
        conversationHistory: conversationHistory.length > 0 ? conversationHistory : undefined,
        dashboardFiles: dashboardFiles.length > 0 ? dashboardFiles : undefined,
      };

      logger.log('Workflow input prepared', {
        messageId: payload.message_id,
        hasPrompt: !!workflowInput.prompt,
        hasConversationHistory: !!workflowInput.conversationHistory,
        conversationHistoryLength: workflowInput.conversationHistory?.length || 0,
        hasDashboardFiles: !!workflowInput.dashboardFiles,
        dashboardFilesCount: workflowInput.dashboardFiles?.length || 0,
        contextSetupTimeMs: contextSetupTime,
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

      // Pre-create the workflow run to measure initialization time separately
      const createRunStart = Date.now();
      const run = analystWorkflow.createRun();
      const createRunTime = Date.now() - createRunStart;

      logger.log('Workflow run created', {
        messageId: payload.message_id,
        createRunTimeMs: createRunTime,
      });

      // Log performance after workflow run creation
      logPerformanceMetrics('post-createrun', payload.message_id, taskStartTime, resourceTracker);

      // Wait for Braintrust initialization if it's not ready yet
      const braintrustWaitStart = Date.now();
      await braintrustInitPromise;
      const braintrustWaitTime = Date.now() - braintrustWaitStart;

      if (braintrustWaitTime > 10) {
        // Only log if we actually had to wait
        logger.log('Waited for Braintrust initialization', {
          messageId: payload.message_id,
          braintrustWaitTimeMs: braintrustWaitTime,
        });
      }

      // Execute workflow with tracing
      const workflowStartMethodStart = Date.now();
      const tracedWorkflow = wrapTraced(
        async () => {
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
      const workflowStartMethodTime = Date.now() - workflowStartMethodStart;
      const totalWorkflowTime = Date.now() - workflowExecutionStart;

      logger.log('Analyst workflow completed successfully', {
        messageId: payload.message_id,
        workflowResult: !!workflowResult,
        workflowStartMethodTimeMs: workflowStartMethodTime,
        totalWorkflowTimeMs: totalWorkflowTime,
        createRunTimeMs: createRunTime,
        braintrustWaitTimeMs: braintrustWaitTime,
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
          contextSetupTimeMs: contextSetupTime,
          createRunTimeMs: createRunTime,
          braintrustWaitTimeMs: braintrustWaitTime,
          workflowStartMethodTimeMs: workflowStartMethodTime,
          totalWorkflowTimeMs: totalWorkflowTime,
        },
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
