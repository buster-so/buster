import React from 'react';
import { createBusterRoute } from '@/routes';
import { BusterRoutes } from '@/routes/busterRoutes';
import { ClientRedirect } from '../../components/ui/layouts/ClientRedirect';
import { prefetchGetMyUserInfo } from '@/api/buster_rest';
import { getSupabaseUserContext } from '@/lib/supabase';
import { AppProviders } from '@/context/AppProviders';

export default async function Layout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabaseContext = await getSupabaseUserContext();
  const { accessToken } = supabaseContext;
  const { initialData: userInfo, queryClient } = await prefetchGetMyUserInfo({
    jwtToken: accessToken
  });

  const newUserRoute = createBusterRoute({ route: BusterRoutes.NEW_USER });

  if (
    (!userInfo?.organizations?.[0]?.id || !userInfo?.user?.name) &&
    !supabaseContext.user?.is_anonymous
  ) {
    return <ClientRedirect to={newUserRoute} />;
  }

  return (
    <AppProviders queryClient={queryClient} supabaseContext={supabaseContext}>
      {children}
    </AppProviders>
  );
}
