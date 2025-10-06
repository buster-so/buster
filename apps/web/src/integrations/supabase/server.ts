import { type CookieOptions, createServerClient } from '@supabase/ssr';
import {
  getCookie,
  getCookies,
  getRequest,
  getResponseHeaders,
  setCookie,
} from '@tanstack/react-start/server';
import { env } from '@/env';

export const COOKIE_OPTIONS: CookieOptions = {
  path: '/',
  secure: import.meta.env.PROD, // Only use secure in production
  sameSite: 'lax', // Type assertion to fix the error
  httpOnly: true, // Make cookies HttpOnly
  maxAge: 60 * 60 * 24 * 7, // 1 week
};

// Helper to safely handle cookie operations
const safeSetCookie = (name: string, value: string, options: CookieOptions) => {
  try {
    setCookie(name, value, options);
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('ERR_HTTP_HEADERS_SENT')) {
      // Silently ignore in production, warn in development

      console.warn(`Cannot set cookie "${name}" - headers already sent`);

      return false;
    }
    // Re-throw other errors
    throw error;
  }
};

const safeParseCookies = () => {
  try {
    const cookies = getCookies();
    return cookies;
  } catch (error) {
    if (error instanceof Error && error.message.includes('ERR_HTTP_HEADERS_SENT')) {
      // Return empty object if we can't parse cookies

      console.warn('Cannot parse cookies - headers already sent');

      return {};
    }
    throw error;
  }
};

export function getSupabaseServerClient() {
  const supabaseUrl = env.VITE_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.VITE_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables for server client');
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        const cookies = safeParseCookies();
        return Object.entries(cookies).map(([name, value]) => ({
          name,
          value,
        }));
      },
      setAll(cookiesToSet) {
        // Track if any cookies were successfully set
        let anySuccess = false;

        for (const cookie of cookiesToSet) {
          const success = safeSetCookie(cookie.name, cookie.value, {
            ...COOKIE_OPTIONS,
            ...cookie.options,
          });

          if (success) {
            anySuccess = true;
          }
        }

        // If no cookies could be set and we're in development, log a warning
        if (!anySuccess && cookiesToSet.length > 0) {
          console.warn('Could not set any cookies - headers may have been sent');
        }
      },
    },
  });
}
