import { getSupabaseServerContext } from '@/context/Supabase/getSupabaseServerContext';
import React from 'react';
import { createBusterRoute } from '@/routes';
import { BusterRoutes } from '@/routes/busterRoutes';
import { headers, cookies } from 'next/headers';
import { ClientRedirect } from '../../components/ui/layouts/ClientRedirect';
import { LayoutClient } from './layoutClient';
import { prefetchGetMyUserInfo } from '@/api/buster_rest';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

export const dynamic = 'force-dynamic';

export default async function Layout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const supabaseContext = await getSupabaseServerContext();
  const { accessToken } = supabaseContext;
  const { initialData: userInfo, queryClient } = await prefetchGetMyUserInfo({
    jwtToken: accessToken
  });

  const pathname = headersList.get('x-next-pathname') as string;
  const cookiePathname = (await cookies()).get('x-next-pathname')?.value;
  const newUserRoute = createBusterRoute({ route: BusterRoutes.NEW_USER });

  if (
    (!userInfo?.organizations?.[0]?.id || !userInfo?.user?.name) &&
    !cookiePathname?.includes(newUserRoute) &&
    pathname !== newUserRoute &&
    !!accessToken //added to avoid bug with anon user
  ) {
    return <ClientRedirect to={newUserRoute} />;
  }

  return (
    <LayoutClient userInfo={userInfo} supabaseContext={supabaseContext}>
      <HydrationBoundary state={dehydrate(queryClient)}>{children}</HydrationBoundary>
    </LayoutClient>
  );
}
