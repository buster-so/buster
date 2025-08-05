import { markdownToPlatejs } from '@buster/server-utils/report';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

const app = new Hono().post(
  '/validate-markdown',
  zValidator('json', z.object({ markdown: z.string() })),
  async (c) => {
    const { markdown } = c.req.valid('json');

    const parsedMarkdown = await markdownToPlatejs(markdown);

    if (parsedMarkdown.error) {
      return c.json({ ...parsedMarkdown }, 400);
    }

    return c.json({ ...parsedMarkdown });
  }
);

export default app;
