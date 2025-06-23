import { cleanupWorkflowDataSources, getAllWorkflowStats } from './data-source-manager';

/**
 * Registry of cleanup handlers for workflows
 */
const cleanupHandlers = new Map<string, (() => Promise<void>)[]>();

/**
 * Register a cleanup handler for a workflow
 */
export function registerWorkflowCleanup(workflowId: string, handler: () => Promise<void>): void {
  if (!cleanupHandlers.has(workflowId)) {
    cleanupHandlers.set(workflowId, []);
  }
  cleanupHandlers.get(workflowId)?.push(handler);
}

/**
 * Execute all cleanup handlers for a workflow
 */
export async function executeWorkflowCleanup(workflowId: string): Promise<void> {
  try {
    // Clean up data sources first
    await cleanupWorkflowDataSources(workflowId);

    // Execute any additional cleanup handlers
    const handlers = cleanupHandlers.get(workflowId) || [];
    const results = await Promise.allSettled(
      handlers.map((handler) =>
        handler().catch((error) => {
          console.error('[WorkflowCleanup] Handler error:', error);
        })
      )
    );

    // Log any failures
    const failures = results.filter((r) => r.status === 'rejected');
    if (failures.length > 0) {
      console.warn(
        `[WorkflowCleanup] ${failures.length} cleanup handlers failed for workflow: ${workflowId}`
      );
    }

    // Remove handlers after execution
    cleanupHandlers.delete(workflowId);

    // Completed cleanup for workflow
  } catch (error) {
    console.error(
      `[WorkflowCleanup] Fatal error during cleanup for workflow ${workflowId}:`,
      error
    );
    // Still remove handlers to prevent memory leak
    cleanupHandlers.delete(workflowId);
  }
}

/**
 * Create a workflow context with automatic cleanup
 */
export function createWorkflowContext(workflowId: string) {
  return {
    workflowId,
    registerCleanup: (handler: () => Promise<void>) => {
      registerWorkflowCleanup(workflowId, handler);
    },
    cleanup: () => executeWorkflowCleanup(workflowId),
  };
}

/**
 * Decorator/wrapper for workflow steps that ensures cleanup on completion or error
 */
export async function withWorkflowCleanup<T>(workflowId: string, fn: () => Promise<T>): Promise<T> {
  try {
    const result = await fn();
    // Cleanup on success
    await executeWorkflowCleanup(workflowId);
    return result;
  } catch (error) {
    // Cleanup on error
    await executeWorkflowCleanup(workflowId);
    throw error;
  }
}

/**
 * Get statistics about active workflows and their resources
 */
export function getActiveWorkflowStats() {
  return {
    activeWorkflows: cleanupHandlers.size,
    workflowIds: Array.from(cleanupHandlers.keys()),
    dataSourceStats: getAllWorkflowStats(),
  };
}

/**
 * Clean up stale workflows (e.g., older than 1 hour)
 * This should be called periodically to prevent resource leaks
 */
export async function cleanupStaleWorkflows(maxAgeMs = 3600000): Promise<void> {
  const stats = getAllWorkflowStats();

  for (const [workflowId, stat] of Object.entries(stats)) {
    if (stat.uptime > maxAgeMs) {
      // Cleaning up stale workflow
      await executeWorkflowCleanup(workflowId);
    }
  }
}
