import type { Context } from 'hono';
import { chatsProxyRouter } from './chats';
import { messagesProxyRouter } from './messages';

type SupportedTables = 'messages' | 'chats';

const proxyRouter: Record<
  SupportedTables,
  (url: URL, userId: string, c: Context) => Promise<URL | Response | undefined>
> = {
  messages: messagesProxyRouter,
  chats: chatsProxyRouter
};

export default proxyRouter;
