import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { cache } from 'react';
import type React from 'react';
import { prefetchGetUser } from '@/api/buster_rest';
import { LayoutHeaderAndSegment, UsersBackButton } from './_LayoutHeaderAndSegment';
import { queryKeys } from '@/api/query_keys';

// Cache the user data fetching to avoid duplicate API calls
const getCachedUserData = cache(async (userId: string) => {
  const queryClient = await prefetchGetUser(userId);
  const { queryKey } = queryKeys.userGetUser(userId);
  const user = queryClient.getQueryData(queryKey);
  return { queryClient, user };
});

export async function generateMetadata(props: {
  params: Promise<{ userId: string }>;
}): Promise<Metadata> {
  const params = await props.params;

  const { user } = await getCachedUserData(params.userId);
  const userName = user?.name;

  return {
    title: userName ? `Permissions - ${userName}` : 'Permissions - User'
  };
}

export default async function Layout(props: {
  children: React.ReactNode;
  params: Promise<{ userId: string }>;
}) {
  const params = await props.params;
  const { children } = props;

  const { queryClient } = await getCachedUserData(params.userId);

  return (
    <div className="flex h-full flex-col space-y-5 overflow-y-auto px-12 py-12">
      <UsersBackButton />
      <HydrationBoundary state={dehydrate(queryClient)}>
        {<LayoutHeaderAndSegment userId={params.userId}>{children}</LayoutHeaderAndSegment>}
      </HydrationBoundary>
    </div>
  );
}
