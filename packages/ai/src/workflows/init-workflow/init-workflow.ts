import { currentSpan, wrapTraced } from 'braintrust';
import { createAgentsMdStep } from '../../steps/init-workflow-steps/create-agents-md-step/create-agents-md-step';
import { findDbtModelPathsStep } from '../../steps/init-workflow-steps/find-dbt-model-paths-step/find-dbt-model-paths-step';
import type { InitWorkflowInput, InitWorkflowOutput } from './types';

/**
 * Runs the init workflow
 * This workflow initializes and processes the initial setup
 */
export async function runInitWorkflow(input: InitWorkflowInput): Promise<void> {
  return wrapTraced(
    async () => {
      currentSpan().log({
        metadata: {
          chatId: input.chatId,
          messageId: input.messageId,
          userId: input.userId,
          organizationId: input.organizationId,
        },
      });

      await initWorkflow(input);

      return;
    },
    {
      name: 'Init Workflow',
    }
  )();
}

export async function initWorkflow(input: InitWorkflowInput): Promise<void> {
  await createAgentsMdStep(input);

  await findDbtModelPathsStep();

  return;
}
