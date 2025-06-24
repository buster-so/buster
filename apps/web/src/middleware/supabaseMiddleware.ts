import { createServerClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import env from '@/config/env';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request
  });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL || '',
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({
            request
          });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        }
      }
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // Get the session data first
  // const { data: sessionData } = await supabase.auth.getSession();

  // // Check if session needs refresh (less than 50 minutes until expiry)
  // if (sessionData.session?.expires_at) {
  //   const expiresAtTimestamp = sessionData.session.expires_at * 1000; // Convert to ms
  //   const now = Date.now();
  //   const timeUntilExpiry = expiresAtTimestamp - now;
  //   const fiftyMinutesInMs = 50 * 60 * 1000;

  //   if (timeUntilExpiry < fiftyMinutesInMs) {
  //     // Refresh the session
  //     await supabase.auth.refreshSession();
  //   }
  // }

  // Get the user (this will use the refreshed session if we refreshed it)
  const {
    data: { user }
  } = await supabase.auth.getUser();

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return [supabaseResponse, user] as [NextResponse, User | null];
}
