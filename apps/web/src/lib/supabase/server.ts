'use server';

import { type CookieOptions, createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import env from '@/config/env';

export const COOKIE_OPTIONS: CookieOptions = {
  path: '/',
  secure: env.NODE_ENV === 'production', // Only use secure in production
  sameSite: 'lax', // Type assertion to fix the error
  httpOnly: true, // Make cookies HttpOnly
  maxAge: 60 * 60 * 24 * 7 // 1 week
};

export async function createClient() {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, { ...options, ...COOKIE_OPTIONS });
          }
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      }
    }
  });
}
