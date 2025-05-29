import { prefetchGetUserDatasetGroups } from '@/api/buster_rest/users';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { UserDatasetGroupsController } from './UserDatasetGroupsController';

export default async function Page(props: { params: Promise<{ userId: string }> }) {
  const params = await props.params;
  const queryClient = await prefetchGetUserDatasetGroups(params.userId);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserDatasetGroupsController userId={params.userId} />
    </HydrationBoundary>
  );
}
