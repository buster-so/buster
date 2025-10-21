import { getMessage, updateMessage } from '@buster/database/queries';
import { GithubActionDocumentationGetSchema } from '@buster/server-shared/github';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

const app = new Hono().delete(
  '/',
  zValidator('param', GithubActionDocumentationGetSchema),
  async (c) => {
    const messageId = c.req.valid('param').id;

    console.info('Documentation deletion request received:', {
      messageId,
    });

    try {
      const message = await getMessage(messageId);
      if (!message) {
        return c.json({ message: 'Message not found' }, 200);
      }

      if (message.isCompleted) {
        return c.json({ message: 'Message already completed' }, 200);
      }

      await updateMessage(messageId, {
        isCompleted: true,
      });

      return c.json({ message: 'Message marked as completed' }, 200);
    } catch (error) {
      console.error('Failed to delete/complete message:', error);

      return c.json({ error: 'Failed to complete message. Please try again later.' }, 500);
    }
  }
);

export default app;
