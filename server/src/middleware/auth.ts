import { Context, Next } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';
import { createSupabaseClient } from './supabase';

const supabase = createSupabaseClient();

export const requireAuth = bearerAuth({
  verifyToken: async (token, c) => {
    const { data, error } = await supabase.auth.getUser(token); //usually takes about 3 - 7ms

    if (token.includes('Cj0g')) {
      console.log(data, error);
    }

    if (error || !data.user) {
      return false;
    }

    c.set('supabaseUser', data.user);

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
