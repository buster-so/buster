import { prefetchGetUserDatasets } from '@/api/buster_rest/users';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { UserDatasetsController } from './UserDatasetsController';

export default async function Page({ params }: { params: { userId: string } }) {
  const queryClient = await prefetchGetUserDatasets(params.userId);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserDatasetsController userId={params.userId} />
    </HydrationBoundary>
  );
}
