import { getMessageStatus } from '@buster/database/queries';
import { GithubActionDocumentationGetSchema } from '@buster/server-shared/github';
import type { GithubActionDocumentationStatusResponse } from '@buster/server-shared/github';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

const app = new Hono().get(
  '/',
  zValidator('query', GithubActionDocumentationGetSchema),
  async (c) => {
    const { messageId } = c.req.valid('query');

    console.info('Documentation status request received:', {
      messageId,
    });

    try {
      // Get the message status from the database
      const result = await getMessageStatus(messageId);

      if (result.status === 'Failed') {
        return c.json(
          {
            messageId,
            ...result,
          },
          500
        );
      }

      const response: GithubActionDocumentationStatusResponse = {
        messageId,
        ...result,
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
