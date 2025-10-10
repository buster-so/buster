import {
  CliChatCreateRequestSchema,
  type CliChatCreateResponse,
} from '@buster/server-shared/chats';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { createCliChatHandler } from './handler';

export const POST = new Hono().post(
  '/',
  zValidator('json', CliChatCreateRequestSchema),
  async (c) => {
    const request = c.req.valid('json');
    const user = c.get('busterUser');

    const response: CliChatCreateResponse = await createCliChatHandler(request, user);

    return c.json(response);
  }
);
