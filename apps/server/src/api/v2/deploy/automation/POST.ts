import type { User } from '@buster/database/queries';
import { deployAutomationTasks, getUserOrganizationId } from '@buster/database/queries';
import type { deploy } from '@buster/server-shared';
import { HTTPException } from 'hono/http-exception';

type AutomationDeployRequest = deploy.AutomationDeployRequest;
type AutomationDeployResult = deploy.AutomationDeployResult;

/**
 * Handler for deploying automation tasks
 */
export async function deployAutomationHandler(
  request: AutomationDeployRequest,
  user: User
): Promise<AutomationDeployResult> {
  // Get user's organization
  const userOrg = await getUserOrganizationId(user.id);
  if (!userOrg || !userOrg.organizationId) {
    throw new HTTPException(401, {
      message: 'User is not associated with an organization',
    });
  }

  // Check permissions
  if (userOrg.role !== 'workspace_admin' && userOrg.role !== 'data_admin') {
    throw new HTTPException(403, {
      message: 'Insufficient permissions. Only workspace admins and data admins can deploy.',
    });
  }

  console.info('[deployAutomationHandler] Automation deployment request received', {
    userId: user.id,
    organizationId: userOrg.organizationId,
    automationCount: request.automation.length,
  });

  try {
    // Deploy automation tasks to the database
    const result = await deployAutomationTasks({
      organizationId: userOrg.organizationId,
      automation: request.automation,
    });

    console.info('[deployAutomationHandler] Automation deployment successful', {
      userId: user.id,
      organizationId: userOrg.organizationId,
      ...result,
    });

    const totalTriggers = request.automation.reduce(
      (sum, agent) => sum + agent.on.length,
      0
    );

    return {
      configured: true,
      agentCount: request.automation.length,
      triggerCount: totalTriggers,
    };
  } catch (error) {
    console.error('[deployAutomationHandler] Automation deployment failed', {
      userId: user.id,
      organizationId: userOrg.organizationId,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      configured: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

