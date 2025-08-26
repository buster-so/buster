import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

const app = new Hono().post(
  '/',
  zValidator(
    'form',
    z.object({
      name: z.string().min(1),
    })
  ),
  async (c) => {
    return c.json({ message: 'User created' });
  }
);

export default app;
