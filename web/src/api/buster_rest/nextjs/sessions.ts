import { useCreateReactQuery } from '@/api/createReactQuery';
import nextApi from '@/api/next/instances';
import type { ApiSessionWithTraces } from 'langfuse';

export const getSession = async (sessionId: string) => {
  return await nextApi
    .get<{ session: ApiSessionWithTraces }>(`/api/sessions`, { params: { sessionId } })
    .then((res) => res.data.session);
};

export const useGetSession = (sessionId: string) => {
  return useCreateReactQuery({
    queryKey: ['session', sessionId],
    queryFn: () => getSession(sessionId),
    useErrorNotification: false
  });
};
