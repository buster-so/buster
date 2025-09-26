import { createServerFileRoute } from '@tanstack/react-start/server';
import { z } from 'zod';
import { env } from '@/env';
import { getSupabaseServerClient } from '../integrations/supabase/server';
import { Route as AppHomeRoute } from './app/_app/home';

// Define the search parameters schema for type safety
const searchParamsSchema = z.object({
  code: z.string().optional(),
  code_challenge: z.string().optional(),
  error: z.string().optional(),
  error_description: z.string().optional(),
  next: z.string().optional(),
});

// Type for the validated search parameters
type SearchParams = z.infer<typeof searchParamsSchema>;

export const ServerRoute = createServerFileRoute('/auth/callback').methods({
  GET: async ({ request }) => {
    // Parse query parameters from the URL
    const url = new URL(request.url);

    // Extract and validate search parameters
    const searchParams: SearchParams = {
      code: url.searchParams.get('code') || undefined,
      code_challenge: url.searchParams.get('code_challenge') || undefined,
      error: url.searchParams.get('error') || undefined,
      error_description: url.searchParams.get('error_description') || undefined,
      next: url.searchParams.get('next') || AppHomeRoute.to || '/app/home',
    };

    // Validate the parameters (optional - provides runtime validation)
    const validatedParams = searchParamsSchema.parse(searchParams);

    const { code, code_challenge, error, error_description } = validatedParams;
    const next = validatedParams.next || AppHomeRoute.to || '/app/home';

    // Handle OAuth errors first
    if (error) {
      console.error('OAuth error received:', error, error_description);
      const errorMessage = error_description || error;
      return new Response(`Authentication failed: ${errorMessage}`, { status: 400 });
    }

    // Use code first, fallback to code_challenge if code is not available
    const authCode = code || code_challenge;

    if (!authCode) {
      console.error('No authorization code or code_challenge found in callback');
      return new Response('Missing authorization code', { status: 400 });
    }

    console.info('Using auth code:', code ? 'code' : 'code_challenge');

    try {
      const supabase = getSupabaseServerClient();

      // Exchange the authorization code for a session
      console.info('Attempting to exchange authorization code for session');
      const { data: sessionData, error: exchangeError } = await supabase.auth
        .exchangeCodeForSession(authCode)
        .catch((authError) => {
          // Handle headers already sent errors gracefully
          if (authError instanceof Error && authError.message.includes('ERR_HTTP_HEADERS_SENT')) {
            console.warn('Headers already sent during code exchange, proceeding with redirect');
            return { data: null, error: null };
          }
          // Return error for other cases
          console.error('Unexpected error during code exchange:', authError);
          return { data: null, error: authError };
        });

      if (exchangeError) {
        console.error('Error exchanging code for session:', exchangeError);
        return new Response(`Authentication failed: ${exchangeError.message}`, { status: 500 });
      }

      if (sessionData?.session) {
        console.info('Successfully exchanged code for session, user:', sessionData.user?.email);
      } else {
        console.info('Code exchange succeeded but no session data received');
      }

      // Construct the redirect URL
      const forwardedHost = request.headers.get('x-forwarded-host');
      const origin = request.headers.get('origin') || env.VITE_PUBLIC_URL || '';
      const isLocalEnv = import.meta.env.DEV;

      // Ensure the redirect path is safe and starts with '/'
      const safePath = next?.startsWith('/') ? next : AppHomeRoute.to || '/app/home';

      let redirectUrl: string;

      if (isLocalEnv) {
        redirectUrl = `${origin}${safePath}`;
      } else if (forwardedHost) {
        redirectUrl = `https://${forwardedHost}${safePath}`;
      } else {
        redirectUrl = `${origin}${safePath}`;
      }

      console.info('Redirecting to:', redirectUrl);

      return new Response(null, {
        status: 302,
        headers: {
          Location: redirectUrl,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    } catch (error) {
      // Final catch-all for any unhandled errors
      if (error instanceof Error && error.message.includes('ERR_HTTP_HEADERS_SENT')) {
        console.warn('Headers already sent in auth callback, attempting redirect anyway');
        // Try to redirect anyway since the auth might have succeeded
        const origin = request.headers.get('origin') || env.VITE_PUBLIC_URL || '';
        const safePath = next?.startsWith('/') ? next : AppHomeRoute.to || '/app/home';
        return new Response(null, {
          status: 302,
          headers: {
            Location: `${origin}${safePath}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });
      }
      console.error('Unexpected error in auth callback:', error);
      return new Response(
        `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { status: 500 }
      );
    }
  },
});
