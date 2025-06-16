import { canUserAccessChat } from '@buster/access-controls';
import type { Context } from 'hono';
import { errorResponse } from '../../../utils/response';
import { extractParamFromWhere } from './_helpers';

export const chatsProxyRouter = async (url: URL, _userId: string, c: Context) => {
  const matches = extractParamFromWhere(url, 'id');
  const chatId = matches?.[0];

  if (!chatId) {
    errorResponse('Chat ID (id) is required', 403);
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
