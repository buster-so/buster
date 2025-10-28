import { and, eq, inArray, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { agentAutomationTasks, githubIntegrations } from '../../schema';
import type { AgentEventTrigger, AgentName } from '../../schema-types';
import { AgentEventTriggerSchema, AgentNameSchema } from '../../schema-types';

// Input validation schema - accepts flattened tasks
const DeployAutomationTasksInputSchema = z.object({
  organizationId: z.string().uuid('Organization ID must be a valid UUID'),
  tasks: z.array(
    z.object({
      agentName: AgentNameSchema,
      eventTrigger: AgentEventTriggerSchema,
      repository: z.string().min(1, 'Repository must be a valid repository name'),
      branches: z.array(z.string()),
    })
  ),
});

type DeployAutomationTasksInput = z.infer<typeof DeployAutomationTasksInputSchema>;

// Task type
interface Task {
  agentName: AgentName;
  eventTrigger: AgentEventTrigger;
  repository: string;
  branches: string[];
}

// Helper to create a unique key for a task
// The unique identifier is agentName + eventTrigger, allowing repository and branches to be updated
function getTaskKey(task: Pick<Task, 'agentName' | 'eventTrigger'>): string {
  return `${task.agentName}|${task.eventTrigger}`;
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
  const { organizationId, tasks } = DeployAutomationTasksInputSchema.parse(params);

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

    for (const task of tasks) {
      if (!task.repository.includes('/')) {
        task.repository = `${githubIntegration.githubOrgName}/${task.repository}`;
      }
    }

    const integrationId = githubIntegration.id;

    return await db.transaction(async (tx) => {
      // 1. Create a map of desired tasks by their unique key
      const desiredTasksMap = new Map<string, Task>();
      for (const task of tasks) {
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
        });

        existingTasksMap.set(key, task);

        if (task.deletedAt === null) {
          activeTasksMap.set(key, task);
        } else {
          softDeletedTasksMap.set(key, task);
        }
      }

      // 3. Determine what actions to take
      const tasksToCreate: Task[] = [];
      const tasksToRestore: Array<{ id: string; task: Task }> = [];
      const tasksToUpdate: Array<{ id: string; task: Task }> = [];

      for (const [key, task] of desiredTasksMap) {
        const softDeletedTask = softDeletedTasksMap.get(key);
        const activeTask = activeTasksMap.get(key);

        if (softDeletedTask) {
          // Restore soft-deleted task and update its repository/branches
          tasksToRestore.push({ id: softDeletedTask.id, task });
        } else if (activeTask) {
          // Update existing active task (repository and/or branches may have changed)
          tasksToUpdate.push({ id: activeTask.id, task });
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

      // Restore soft-deleted tasks and update their repository/branches
      if (tasksToRestore.length > 0) {
        for (const { id, task } of tasksToRestore) {
          await tx
            .update(agentAutomationTasks)
            .set({
              deletedAt: null,
              repository: task.repository,
              branches: task.branches,
              updatedAt: now,
            })
            .where(eq(agentAutomationTasks.id, id));
        }
        restored = tasksToRestore.length;
      }

      // Update existing active tasks (repository and/or branches may have changed)
      if (tasksToUpdate.length > 0) {
        for (const { id, task } of tasksToUpdate) {
          await tx
            .update(agentAutomationTasks)
            .set({
              repository: task.repository,
              branches: task.branches,
              updatedAt: now,
            })
            .where(eq(agentAutomationTasks.id, id));
        }
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
      taskCount: tasks.length,
      error: error instanceof Error ? error.message : error,
    });

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Failed to deploy automation tasks');
  }
};
