import { errorResponse } from '../../../utils/response';
import { type Context } from 'hono';
import { canUserAccessChat } from '@/access-controls/chats';
import { extractParamFromWhere } from './_helpers';

export const chatsProxyRouter = async (url: URL, userId: string, c: Context) => {
  const matches = extractParamFromWhere(url, 'id');
  const chatId = matches?.[0];

  if (!chatId) {
    return errorResponse(c, 'Chat ID (id) is required', 403);
  }

  const userHasAccessToChat = await canUserAccessChat({
    userId: c.get('supabaseUser').id,
    chatId
  });

  if (!userHasAccessToChat) {
    return errorResponse(c, 'You do not have access to this chat', 403);
  }

  return url;
};
