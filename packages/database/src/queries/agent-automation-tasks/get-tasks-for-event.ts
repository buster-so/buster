import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { agentAutomationTasks, automationTaskRepositories } from '../../schema';
import { AgentAutomationTaskEventTriggerSchema } from '../../schema-types';

const GetAgentTasksForEventSchema = z.object({
  organizationId: z.string(),
  eventTrigger: z.enum(AgentAutomationTaskEventTriggerSchema.options),
  repository: z.string().optional(),
});

type GetAgentTasksForEvent = z.infer<typeof GetAgentTasksForEventSchema>;
/**
 * Get agent automation tasks for a specific organization and event trigger
 * Includes the associated repositories for each task
 */
export async function getAgentTasksForEvent(params: GetAgentTasksForEvent) {
  const { organizationId, eventTrigger, repository } = params;
  const whereClauseStatements = [
    eq(agentAutomationTasks.organizationId, organizationId),
    eq(agentAutomationTasks.eventTrigger, eventTrigger),
    isNull(agentAutomationTasks.deletedAt),
  ];

  if (repository) {
    whereClauseStatements.push(eq(automationTaskRepositories.actionRepository, repository));
  }

  const results = await db
    .select({
      task: agentAutomationTasks,
      repository: automationTaskRepositories,
    })
    .from(agentAutomationTasks)
    .leftJoin(
      automationTaskRepositories,
      eq(agentAutomationTasks.id, automationTaskRepositories.taskId)
    )
    .where(and(...whereClauseStatements));

  return results;
}
