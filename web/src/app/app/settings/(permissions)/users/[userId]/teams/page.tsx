import { UserTeamsController } from './UserTeamsController';
import { prefetchGetUserTeams } from '@/api/buster_rest/users';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

export default async function Page({ params }: { params: { userId: string } }) {
  const queryClient = await prefetchGetUserTeams(params.userId);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserTeamsController userId={params.userId} />
    </HydrationBoundary>
  );
}
