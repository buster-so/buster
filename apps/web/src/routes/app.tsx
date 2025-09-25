import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { prefetchGetMyUserInfo } from '@/api/buster_rest/users/queryRequests';
import { getAppLayout } from '@/api/server-functions/getAppLayout';
import { AppProviders } from '@/context/Providers';
import { getSupabaseSession } from '@/integrations/supabase/getSupabaseUserClient';
import { BUSTER_SIGN_UP_URL } from '../config/externalRoutes';

export const Route = createFileRoute('/app')({
  context: ({ context }) => ({ ...context, getAppLayout }),
  beforeLoad: async () => {
    try {
      const supabaseSession = await getSupabaseSession();
      const { isExpired, accessToken = '' } = supabaseSession;
      if (isExpired || !accessToken) {
        console.error('Access token is expired or not found');
        throw redirect({ to: '/auth/login', replace: true, statusCode: 307 });
      }
      return {
        supabaseSession,
      };
    } catch (error) {
      console.error('Error in app route beforeLoad:', error);
      throw redirect({ to: '/auth/login', replace: true, statusCode: 307 });
    }
  },
  loader: async ({ context }) => {
    const { queryClient, supabaseSession } = context;
    try {
      const [user] = await Promise.all([prefetchGetMyUserInfo(queryClient)]);
      if (user && user?.organizations?.length === 0) {
        throw redirect({ href: BUSTER_SIGN_UP_URL, replace: true, statusCode: 307 });
      }
      return {
        supabaseSession,
      };
    } catch (error) {
      // Re-throw redirect Responses so the router can handle them (e.g., getting-started)
      if (error instanceof Response) {
        throw error;
      }
      console.error('Error in app route loader:', error);
      throw redirect({ to: '/auth/login', replace: true, statusCode: 307 });
    }
  },
  component: () => {
    const { supabaseSession } = Route.useLoaderData();

    return (
      <AppProviders supabaseSession={supabaseSession}>
        <Outlet />
      </AppProviders>
    );
  },
});
