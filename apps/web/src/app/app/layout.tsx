'use server';

import { headers } from 'next/headers';
import type React from 'react';
import { prefetchGetMyUserInfo } from '@/api/buster_rest/users/queryRequests';
import { queryKeys } from '@/api/query_keys';
import { AppProviders } from '@/context/AppProviders';
import { getSupabaseUserContext } from '@/lib/supabase';
import { createBusterRoute } from '@/routes';
import { BusterRoutes } from '@/routes/busterRoutes';
import { ClientRedirect } from '../../components/ui/layouts/ClientRedirect';

const newUserRoute = createBusterRoute({ route: BusterRoutes.NEW_USER });
const loginRoute = createBusterRoute({ route: BusterRoutes.AUTH_LOGIN });

export default async function Layout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = headers();
  const pathname = headersList.get('x-pathname');
  const supabaseContext = await getSupabaseUserContext();
  const { accessToken } = supabaseContext;
  const queryClient = await prefetchGetMyUserInfo({
    jwtToken: accessToken
  });

  const userInfoState = queryClient.getQueryState(queryKeys.userGetUserMyself.queryKey);

  const is402Error = userInfoState?.status === 'error' && userInfoState?.error?.status === 402; //402 is the payment required error code

  if (is402Error) {
    return <ClientRedirect to={createBusterRoute({ route: BusterRoutes.INFO_GETTING_STARTED })} />;
  }

  const userInfo = queryClient.getQueryData(queryKeys.userGetUserMyself.queryKey);

  if (
    (supabaseContext.user?.is_anonymous && pathname !== loginRoute) ||
    !supabaseContext?.user?.id
  ) {
    const redirectParam = pathname ? encodeURIComponent(pathname) : '';
    const loginUrlWithRedirect = redirectParam ? `${loginRoute}?next=${redirectParam}` : loginRoute;
    return <ClientRedirect to={loginUrlWithRedirect} />;
  }

  if ((!userInfo?.organizations?.[0]?.id || !userInfo?.user?.name) && pathname !== newUserRoute) {
    return <ClientRedirect to={newUserRoute} />;
  }

  return (
    <AppProviders queryClient={queryClient} supabaseContext={supabaseContext}>
      {children}
    </AppProviders>
  );
}
