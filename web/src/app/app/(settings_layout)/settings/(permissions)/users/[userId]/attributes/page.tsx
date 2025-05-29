import { prefetchGetUserAttributes } from '@/api/buster_rest/users';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { UserAttributesController } from './UserAttributesController';

export default async function Page(props: { params: Promise<{ userId: string }> }) {
  const params = await props.params;

  const { userId } = params;

  const queryClient = await prefetchGetUserAttributes(userId);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserAttributesController userId={userId} />
    </HydrationBoundary>
  );
}
