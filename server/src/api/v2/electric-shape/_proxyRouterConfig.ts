import { type Context } from 'hono';
import { messagesProxyRouter } from './messages';

type SupportedTables = 'messages';

const proxyRouter: Record<SupportedTables, (url: URL, userId: string, c: Context) => Promise<URL | Response>> = {
  messages: messagesProxyRouter
};

export default proxyRouter;
