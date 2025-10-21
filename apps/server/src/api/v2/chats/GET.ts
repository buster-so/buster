import { listChats } from '@buster/database/queries';
import { type GetChatsListResponseV2, GetChatsRequestSchemaV2 } from '@buster/server-shared/chats';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

const app = new Hono().get('/', zValidator('query', GetChatsRequestSchemaV2), async (c) => {
  const user = c.get('busterUser');
  const queryParams = c.req.valid('query');

  // Transform request params to database params
  // Web app defaults to 'analyst' chat type
  const listChatsParams = {
    userId: user.id,
    chatType: 'analyst' as const,
    page: queryParams.page ?? 1,
    page_size: queryParams.page_size ?? 250,
  };

  const paginatedChats: GetChatsListResponseV2 = await listChats(listChatsParams);

  return c.json(paginatedChats);
});

export default app;
