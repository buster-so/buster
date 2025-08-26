import { getUser, getUserOrganizationId } from '@buster/database';
import type { Context, Next } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';
import { isOrganizationAdmin } from '../utils/admin';
import { getSupabaseClient } from './supabase';

export const requireAuth = bearerAuth({
  verifyToken: async (token, c) => {
    try {
      const supabase = await getSupabaseClient();
      const { data, error } = await supabase.auth.getUser(token); //usually takes about 3 - 7ms

      if (error) {
        // Log specific auth errors to help with debugging
        console.warn('Token validation failed:', {
          error: error.message,
          // Don't log the actual token for security
          tokenPrefix: `${token.substring(0, 20)}...`,
        });
        return false;
      }

      if (!data.user) {
        console.warn('No user found for valid token');
        return false;
      }

      // Set user in context for use in route handlers
      c.set('supabaseUser', data.user);

      // Get the corresponding user from your database
      const busterUser = await getUser({ id: data.user.id });

      if (!busterUser) {
        console.warn('Supabase user found but no corresponding database user:', {
          supabaseUserId: data.user.id,
          email: data.user.email,
        });
        return false;
      }

      c.set('busterUser', busterUser);

      // Ensure user is not anonymous
      const isAuthenticated = !data.user.is_anonymous;

      if (!isAuthenticated) {
        console.info('Anonymous user attempted to access protected resource');
      }

      return isAuthenticated;
    } catch (error) {
      console.error('Unexpected error during token validation:', error);
      return false;
    }
  },
});

export async function requireUser(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('Missing or invalid Authorization header');
    throw new Error('User not authenticated - missing Authorization header');
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    console.warn('Empty token in Authorization header');
    throw new Error('User not authenticated - empty token');
  }

  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.auth.getUser(token);

    if (error) {
      console.warn('Token validation failed in requireUser:', {
        error: error.message,
      });
      throw new Error('User not authenticated - invalid token');
    }

    const user = data.user;

    if (!user || user.is_anonymous) {
      console.warn('No valid user found or user is anonymous');
      throw new Error('User not authenticated - no valid user');
    }

    // User is valid, continue to next middleware/handler
    return next();
  } catch (error) {
    console.error('Unexpected error in requireUser:', error);
    throw new Error('User not authenticated - server error');
  }
}

// Utility function to get user organization (can be called from other middleware)
const getUserOrganization = async (c: Context) => {
  const user = c.get('busterUser');
  const userOrganizationInfo = c.get('userOrganizationInfo');

  if (userOrganizationInfo) {
    return userOrganizationInfo;
  }

  const userOrg = await getUserOrganizationId(user.id);

  if (!userOrg) {
    throw new Error('User is not associated with an organization');
  }

  c.set('userOrganizationInfo', userOrg);

  return userOrg;
};

// Middleware version that can be used in route chains
export const requireOrganization = async (c: Context, next: Next) => {
  await getUserOrganization(c);
  await next();
};

export const requireOrganizationAdmin = async (c: Context, next: Next) => {
  const user = c.get('busterUser');

  if (!user?.id) {
    console.warn('This is likely an issue where requireAuth middleware was not called first');
    return c.json({ message: 'User not authenticated' }, 401);
  }

  const userOrg = await getUserOrganization(c);

  const isAdmin = isOrganizationAdmin(userOrg.role);

  if (!isAdmin) {
    return c.json({ message: 'User is not an organization admin' }, 403);
  }

  // If all checks pass, continue to the next middleware/handler
  return await next();
};
