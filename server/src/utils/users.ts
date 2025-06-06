import { type Context } from 'hono';

export const getUserIdFromContext = (c: Context) => {
  const { id: userId } = c.get('supabaseUser');
  return userId;
};
