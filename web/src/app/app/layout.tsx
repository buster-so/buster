'use server';

import { useSupabaseServerContext } from '@/context/Supabase/useSupabaseContext';
import React from 'react';
import { getMyUserInfo } from '@/api/buster_rest/users/requests';
import { getAppSplitterLayout } from '@/components/layout/AppSplitter';
import { useBusterSupabaseAuthMethods } from '@/hooks/useBusterSupabaseAuthMethods';
import { createBusterRoute } from '@/routes';
import { BusterAppRoutes } from '@/routes/busterRoutes/busterAppRoutes';
import { headers, cookies } from 'next/headers';
import { ClientRedirect } from './_components/ClientRedirect';
import { AppLayoutClient } from './layoutClient';

export default async function Layout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = headers();
  const supabaseContext = await useSupabaseServerContext();
  const userInfo = await getMyUserInfo({ jwtToken: supabaseContext.accessToken });
  const defaultLayout = await getAppSplitterLayout('app-layout', ['230px', 'auto']);
  const { signOut } = useBusterSupabaseAuthMethods();
  const pathname = headersList.get('x-next-pathname') as string;
  const cookiePathname = cookies().get('x-next-pathname')?.value;
  const newUserRoute = createBusterRoute({ route: BusterAppRoutes.NEW_USER });

  if (
    (!userInfo?.organizations[0]?.id || !userInfo?.user?.name) &&
    !cookiePathname?.includes(newUserRoute) &&
    pathname !== newUserRoute &&
    supabaseContext.accessToken //added to avoid bug with anon user
  ) {
    return <ClientRedirect to={newUserRoute} />;
  }

  return (
    <AppLayoutClient
      userInfo={userInfo}
      supabaseContext={supabaseContext}
      defaultLayout={defaultLayout}
      signOut={signOut}>
      {children}
    </AppLayoutClient>
  );
}
