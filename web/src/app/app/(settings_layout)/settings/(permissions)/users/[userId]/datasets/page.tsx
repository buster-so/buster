import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { prefetchGetUserDatasets } from '@/api/buster_rest/users';
import { UserDatasetsController } from './UserDatasetsController';

export default async function Page(props: { params: Promise<{ userId: string }> }) {
  const params = await props.params;
  const queryClient = await prefetchGetUserDatasets(params.userId);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserDatasetsController userId={params.userId} />
    </HydrationBoundary>
  );
}
