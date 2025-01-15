import { prefetchGetUser } from '@/api/buster-rest';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { UserController } from './UserController';

export default async function Page({ params }: { params: { userId: string } }) {
  const queryClient = await prefetchGetUser(params.userId);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserController userId={params.userId} />
    </HydrationBoundary>
  );
}
