import { UserAttributesController } from './UserAttributesController';
import { prefetchGetUserAttributes } from '@/api/buster_rest/users';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

export default async function Page({ params: { userId } }: { params: { userId: string } }) {
  const queryClient = await prefetchGetUserAttributes(userId);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserAttributesController userId={userId} />
    </HydrationBoundary>
  );
}
