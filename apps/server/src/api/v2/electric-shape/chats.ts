import { canUserAccessChat } from '@buster/access-controls';
import type { Context } from 'hono';
import { errorResponse } from '../../../utils/response';
import { extractParamFromWhere } from './_helpers';

export const chatsProxyRouter = async (url: URL, _userId: string, c: Context) => {
  const chatId = extractParamFromWhere(url, 'id');

  if (!chatId) {
    throw errorResponse('Chat ID (id) is required', 403);
  }

  // User must have access to the chat
  const userHasAccessToChat = await canUserAccessChat({
    userId: c.get('supabaseUser').id,
    chatId,
  });

  if (!userHasAccessToChat) {
    throw errorResponse('You do not have access to this chat', 403);
  }

  return url;
};
