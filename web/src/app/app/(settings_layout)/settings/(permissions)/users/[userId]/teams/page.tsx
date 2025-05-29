import { prefetchGetUserTeams } from '@/api/buster_rest/users';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { UserTeamsController } from './UserTeamsController';

export default async function Page(props: { params: Promise<{ userId: string }> }) {
  const params = await props.params;
  const queryClient = await prefetchGetUserTeams(params.userId);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserTeamsController userId={params.userId} />
    </HydrationBoundary>
  );
}
