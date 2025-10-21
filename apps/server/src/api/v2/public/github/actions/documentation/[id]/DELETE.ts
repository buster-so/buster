import { getMessage, updateMessage } from '@buster/database/queries';
import { getCommandDetails } from '@buster/sandbox';
import {
  GithubActionDocumentationGetParamsSchema,
  GithubActionDocumentationGetQuerySchema,
} from '@buster/server-shared/github';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

const app = new Hono().delete(
  '/',
  zValidator('param', GithubActionDocumentationGetParamsSchema),
  zValidator('query', GithubActionDocumentationGetQuerySchema),
  async (c) => {
    const messageId = c.req.valid('param').id;
    const { commandId, sessionId, sandboxId } = c.req.valid('query');

    console.info('Documentation deletion request received:', {
      messageId,
      commandId,
      sessionId,
      sandboxId,
    });

    try {
      const message = await getMessage(messageId);
      if (!message) {
        return c.json({ message: 'Message not found' }, 200);
      }

      if (message.isCompleted) {
        return c.json({ message: 'Message already completed' }, 200);
      }

      // If command props exist, check command details for error information
      let errorReason: string | undefined;
      if (commandId && sessionId && sandboxId) {
        try {
          const command = await getCommandDetails({ commandId, sessionId, sandboxId });

          // If command has a non-zero exit code, capture the error
          if (command.exitCode !== undefined && command.exitCode !== 0) {
            errorReason = command.stderr || 'Command failed with non-zero exit code';
            if (command.stderr) {
              console.error('Documentation generation failed:', command.stderr);
            }
          }
        } catch (error) {
          console.error('Failed to get command details:', error);
          // Continue with completion even if we can't get command details
        }
      }

      await updateMessage(messageId, {
        isCompleted: true,
        ...(errorReason && { errorReason }),
      });

      return c.json({ message: 'Message marked as completed' }, 200);
    } catch (error) {
      console.error('Failed to delete/complete message:', error);

      return c.json({ error: 'Failed to complete message. Please try again later.' }, 500);
    }
  }
);

export default app;
