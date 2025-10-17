import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { prefetchGetMyUserInfo } from '@/api/buster_rest/users/queryRequests';
import { getAppLayout } from '@/api/server-functions/getAppLayout';
import { AppProviders } from '@/context/Providers';
import { getSupabaseSession } from '@/integrations/supabase/getSupabaseUserClient';
import { BUSTER_SIGN_UP_URL } from '../config/externalRoutes';

export const Route = createFileRoute('/app')({
  context: ({ context }) => ({ ...context, getAppLayout }),
  beforeLoad: async ({ matches }) => {
    const lastMatch = matches[matches.length - 1];
    try {
      const supabaseSession = await getSupabaseSession();
      const { isExpired, accessToken = '' } = supabaseSession;
      if (isExpired || !accessToken) {
        console.error('Access token is expired or not found');
        throw redirect({
          to: '/auth/login',
          search: { next: lastMatch.pathname },
          replace: true,
          statusCode: 307,
        });
      }
      return {
        supabaseSession,
      };
    } catch (error) {
      console.error('Error in app route beforeLoad:', error);
      throw redirect({
        to: '/auth/login',
        search: { next: lastMatch.pathname },
        replace: true,
        statusCode: 307,
      });
    }
  },
  loader: async ({ context }) => {
    const { queryClient, supabaseSession } = context;

    const user = await prefetchGetMyUserInfo(queryClient);

    if (!user?.organizations?.[0]?.id) {
      throw redirect({
        href: BUSTER_SIGN_UP_URL,
        replace: true,
        reloadDocument: true,
        statusCode: 307,
      });
    }

    return {
      supabaseSession,
    };
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
