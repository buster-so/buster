import { canUserAccessChat } from '@buster/access-controls';
import type { Context } from 'hono';
import { errorResponse } from '../../../utils/response';
import { extractParamFromWhere } from './_helpers';

export const messagesProxyRouter = async (url: URL, _userId: string, c: Context) => {
  console.log('messagesProxyRouter', url);
  const matches = extractParamFromWhere(url, 'chat_id');
  const chatId = matches?.[0];

  console.log('chatId', chatId);

  if (!chatId) {
    errorResponse('Chat ID is required', 403);
    return;
  }

  const userHasAccessToChat = await canUserAccessChat({
    userId: c.get('supabaseUser').id,
    chatId,
  });

  if (!userHasAccessToChat) {
    errorResponse('You do not have access to this chat', 403);
    return;
  }

  return url;
};
