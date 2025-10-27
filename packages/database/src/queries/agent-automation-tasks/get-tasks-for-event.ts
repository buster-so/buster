import { and, eq, isNull, arrayOverlaps } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { agentAutomationTasks } from '../../schema';
import { AgentEventTriggerSchema } from '../../schema-types';

const GetAgentTasksForEventSchema = z.object({
  organizationId: z.string(),
  eventTrigger: z.enum(AgentEventTriggerSchema.options),
  repository: z.string(),
  branch: z.string(),
});

type GetAgentTasksForEvent = z.infer<typeof GetAgentTasksForEventSchema>;
/**
 * Get agent automation tasks for a specific organization and event trigger
 * Includes the associated repositories for each task
 */
export async function getAgentTasksForEvent(params: GetAgentTasksForEvent) {
  const { organizationId, eventTrigger, repository, branch } = params;

  const results = await db
    .select({
      task: agentAutomationTasks,
    })
    .from(agentAutomationTasks)
    .where(and(
      eq(agentAutomationTasks.organizationId, organizationId),
      eq(agentAutomationTasks.eventTrigger, eventTrigger),
      isNull(agentAutomationTasks.deletedAt),
      eq(agentAutomationTasks.repository, repository),
      arrayOverlaps(agentAutomationTasks.branches, [branch, '*']),
    ));

  return results;
}
