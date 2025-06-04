import { Context, Next } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';
import { createSupabaseClient } from './supabase';

const supabase = createSupabaseClient();

export const requireAuth = bearerAuth({
  verifyToken: async (token) => {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return false;
    }

    return !!data.user.is_anonymous === false;
  }
});

export async function requireUser(c: Context, next: Next) {
  const token = c.req.header('Authorization')?.split(' ')[1];

  if (!token) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase.auth.getUser(token);

  const user = data.user;

  if (!user || error || user.is_anonymous) {
    throw new Error('User not authenticated');
  }

  return next();
}
