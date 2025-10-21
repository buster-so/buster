import { getMessageStatus, updateMessage } from '@buster/database/queries';
import { getCommandDetails } from '@buster/sandbox';
import type { GithubActionDocumentationStatusResponse } from '@buster/server-shared/github';
import {
  GithubActionDocumentationGetParamsSchema,
  GithubActionDocumentationGetQuerySchema,
} from '@buster/server-shared/github';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

const app = new Hono().get(
  '/',
  zValidator('param', GithubActionDocumentationGetParamsSchema),
  zValidator('query', GithubActionDocumentationGetQuerySchema),
  async (c) => {
    const messageId = c.req.valid('param').id;
    const { commandId, sessionId, sandboxId } = c.req.valid('query');

    console.info('Documentation status request received:', {
      messageId,
      commandId,
      sessionId,
      sandboxId,
    });

    try {
      // Get the message status from the database
      const result = await getMessageStatus(messageId);

      if (!result) {
        const response: GithubActionDocumentationStatusResponse = {
          messageId,
          status: 'Failed',
          errorReason: 'Message not found',
        };
        return c.json(response, 404);
      }

      // If command props don't exist, just check message status
      if (!commandId || !sessionId || !sandboxId) {
        if (!result.isCompleted) {
          const response: GithubActionDocumentationStatusResponse = {
            messageId,
            status: 'InProgress',
          };
          return c.json(response, 200);
        }

        // If completed but has error
        if (result.isCompleted && result.errorReason) {
          console.error('Documentation Agent failed:', result.errorReason);
          const response: GithubActionDocumentationStatusResponse = {
            messageId,
            status: 'Failed',
            errorReason:
              'Documentation Agent failed, please reach out to the buster team and try again.',
          };
          return c.json(response, 200);
        }

        // If completed successfully
        const response: GithubActionDocumentationStatusResponse = {
          messageId,
          status: 'Complete',
        };
        return c.json(response, 200);
      }

      // If command props exist, check command details
      const command = await getCommandDetails({ commandId, sessionId, sandboxId });

      // If command doesn't have an exit code, it's still in progress
      if (command.exitCode === undefined) {
        const response: GithubActionDocumentationStatusResponse = {
          messageId,
          status: 'InProgress',
        };
        return c.json(response, 200);
      }

      // If exit code is 0 (success)
      if (command.exitCode === 0) {
        if (command.stdout) {
          console.info('Documentation generation completed successfully:', command.stdout);
        }

        // Update message as completed if not already
        if (!result.isCompleted) {
          await updateMessage(messageId, { isCompleted: true });
        }

        const response: GithubActionDocumentationStatusResponse = {
          messageId,
          status: 'Complete',
        };
        return c.json(response, 200);
      }

      // If exit code indicates failure (non-zero)
      if (command.stderr) {
        console.error('Documentation generation failed:', command.stderr);
      }

      // Update message with failure status if not already set
      if (!result.isCompleted || !result.errorReason) {
        await updateMessage(messageId, {
          isCompleted: true,
          errorReason: command.stderr || 'Command failed with non-zero exit code',
        });
      }

      const response: GithubActionDocumentationStatusResponse = {
        messageId,
        status: 'Failed',
        errorReason:
          'Documentation Agent failed, please reach out to the buster team and try again.',
      };
      return c.json(response, 200);
    } catch (error) {
      console.error('Failed to get message status:', error);

      const response: GithubActionDocumentationStatusResponse = {
        messageId,
        status: 'Failed',
        errorReason: 'Failed to poll for message status. Please try again later.',
      };

      return c.json(response, 500);
    }
  }
);

export default app;
