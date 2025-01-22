import { UserDatasetGroupsController } from './UserDatasetGroupsController';
import { prefetchGetUserDatasetGroups } from '@/api/buster_rest/users';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

export default async function Page({ params }: { params: { userId: string } }) {
  const queryClient = await prefetchGetUserDatasetGroups(params.userId);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserDatasetGroupsController userId={params.userId} />
    </HydrationBoundary>
  );
}
