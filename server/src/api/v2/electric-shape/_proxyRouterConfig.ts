import { type Context } from 'hono';
import { messagesProxyRouter } from './messages';
import { chatsProxyRouter } from './chats';

type SupportedTables = 'messages' | 'chats';

const proxyRouter: Record<SupportedTables, (url: URL, userId: string, c: Context) => Promise<URL | Response>> = {
  messages: messagesProxyRouter,
  chats: chatsProxyRouter
};

export default proxyRouter;
