import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { agentAutomationTasks, githubIntegrations } from '../../schema';
import type { AgentEventTrigger, AgentName } from '../../schema-types';

// Input validation schema
const DeployAutomationTasksInputSchema = z.object({
  organizationId: z.string().uuid('Organization ID must be a valid UUID'),
  automation: z.array(
    z.object({
      agent: z.string(),
      on: z.array(
        z.object({
          event: z.enum(['pull_request', 'push']),
          repository: z.string().optional(),
          branches: z.array(z.string()).optional(),
        })
      ),
    })
  ),
});

type DeployAutomationTasksInput = z.infer<typeof DeployAutomationTasksInputSchema>;

// Internal type for flattened tasks
interface FlattenedTask {
  agentName: AgentName;
  eventTrigger: AgentEventTrigger;
  repository: string;
  branches: string[];
}

// Helper to create a unique key for a task
function getTaskKey(task: FlattenedTask): string {
  return `${task.agentName}|${task.eventTrigger}|${task.repository}|${JSON.stringify(task.branches.sort())}`;
}

/**
 * Deploys automation tasks for an organization.
 * - Creates new tasks for configurations not already present
 * - Updates existing active tasks
 * - Restores soft-deleted tasks that should be active
 * - Soft deletes tasks that are no longer in the configuration
 */
export const deployAutomationTasks = async (
  params: DeployAutomationTasksInput
): Promise<{
  created: number;
  updated: number;
  deleted: number;
  restored: number;
}> => {
  const { organizationId, automation } = DeployAutomationTasksInputSchema.parse(params);

  try {
    const now = new Date().toISOString();

    // Get the GitHub integration for this organization
    const [githubIntegration] = await db
      .select()
      .from(githubIntegrations)
      .where(
        and(
          eq(githubIntegrations.organizationId, organizationId),
          isNull(githubIntegrations.deletedAt)
        )
      )
      .limit(1);

    if (!githubIntegration) {
      throw new Error('No active GitHub integration found for this organization');
    }

    const integrationId = githubIntegration.id;

    return await db.transaction(async (tx) => {
      // 1. Flatten the automation config into individual tasks
      const desiredTasks: FlattenedTask[] = [];
      for (const agentConfig of automation) {
        for (const eventTrigger of agentConfig.on) {
          if (!eventTrigger.repository) {
            throw new Error(
              `Repository must be specified for agent "${agentConfig.agent}" with event "${eventTrigger.event}"`
            );
          }

          desiredTasks.push({
            agentName: agentConfig.agent as AgentName,
            eventTrigger: eventTrigger.event as AgentEventTrigger,
            repository: eventTrigger.repository,
            branches: eventTrigger.branches || ['*'],
          });
        }
      }

      // Create a map of desired tasks by their unique key
      const desiredTasksMap = new Map<string, FlattenedTask>();
      for (const task of desiredTasks) {
        desiredTasksMap.set(getTaskKey(task), task);
      }

      // 2. Get all existing tasks for this organization and integration (including soft-deleted)
      const existingTasks = await tx
        .select()
        .from(agentAutomationTasks)
        .where(
          and(
            eq(agentAutomationTasks.organizationId, organizationId),
            eq(agentAutomationTasks.integrationId, integrationId)
          )
        );

      // Create maps for existing tasks
      const existingTasksMap = new Map<string, (typeof existingTasks)[0]>();
      const activeTasksMap = new Map<string, (typeof existingTasks)[0]>();
      const softDeletedTasksMap = new Map<string, (typeof existingTasks)[0]>();

      for (const task of existingTasks) {
        const key = getTaskKey({
          agentName: task.agentName,
          eventTrigger: task.eventTrigger,
          repository: task.repository,
          branches: task.branches,
        });

        existingTasksMap.set(key, task);

        if (task.deletedAt === null) {
          activeTasksMap.set(key, task);
        } else {
          softDeletedTasksMap.set(key, task);
        }
      }

      // 3. Determine what actions to take
      const tasksToCreate: FlattenedTask[] = [];
      const tasksToRestore: string[] = [];
      const tasksToUpdate: string[] = [];

      for (const [key, task] of desiredTasksMap) {
        const softDeletedTask = softDeletedTasksMap.get(key);
        const activeTask = activeTasksMap.get(key);

        if (softDeletedTask) {
          // Restore soft-deleted task
          tasksToRestore.push(softDeletedTask.id);
        } else if (activeTask) {
          // Update existing active task
          tasksToUpdate.push(activeTask.id);
        } else {
          // Create new task
          tasksToCreate.push(task);
        }
      }

      // Determine tasks to delete (active tasks not in desired set)
      const tasksToDelete: string[] = [];
      for (const [key, task] of activeTasksMap) {
        if (!desiredTasksMap.has(key)) {
          tasksToDelete.push(task.id);
        }
      }

      // 4. Execute the operations
      let created = 0;
      let updated = 0;
      let deleted = 0;
      let restored = 0;

      // Create new tasks
      if (tasksToCreate.length > 0) {
        const newTasks = tasksToCreate.map((task) => ({
          organizationId,
          integrationId,
          agentName: task.agentName,
          eventTrigger: task.eventTrigger,
          repository: task.repository,
          branches: task.branches,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        }));

        await tx.insert(agentAutomationTasks).values(newTasks);
        created = tasksToCreate.length;
      }

      // Restore soft-deleted tasks
      if (tasksToRestore.length > 0) {
        await tx
          .update(agentAutomationTasks)
          .set({
            deletedAt: null,
            updatedAt: now,
          })
          .where(inArray(agentAutomationTasks.id, tasksToRestore));
        restored = tasksToRestore.length;
      }

      // Update existing active tasks
      if (tasksToUpdate.length > 0) {
        await tx
          .update(agentAutomationTasks)
          .set({
            updatedAt: now,
          })
          .where(inArray(agentAutomationTasks.id, tasksToUpdate));
        updated = tasksToUpdate.length;
      }

      // Soft delete tasks that should no longer exist
      if (tasksToDelete.length > 0) {
        await tx
          .update(agentAutomationTasks)
          .set({
            deletedAt: now,
            updatedAt: now,
          })
          .where(inArray(agentAutomationTasks.id, tasksToDelete));
        deleted = tasksToDelete.length;
      }

      return { created, updated, deleted, restored };
    });
  } catch (error) {
    console.error('Error deploying automation tasks:', {
      organizationId,
      automationCount: automation.length,
      error: error instanceof Error ? error.message : error,
    });

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Failed to deploy automation tasks');
  }
};

