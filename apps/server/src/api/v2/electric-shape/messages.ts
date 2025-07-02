import { canUserAccessChat } from '@buster/access-controls';
import type { Context } from 'hono';
import { errorResponse } from '../../../utils/response';
import { extractParamFromWhere } from './_helpers';

export const messagesProxyRouter = async (url: URL, _userId: string, c: Context) => {
  const chatId = extractParamFromWhere(url, 'chat_id');

  if (!chatId) {
    throw errorResponse('Chat ID is required', 403);
  }

  const userHasAccessToChat = await canUserAccessChat({
    userId: c.get('supabaseUser').id,
    chatId,
  });

  if (!userHasAccessToChat) {
    throw errorResponse('You do not have access to this chat', 403);
  }

  return url;
};
