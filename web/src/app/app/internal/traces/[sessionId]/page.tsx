'use client';

import { useGetSession } from '@/api/buster_rest/nextjs/sessions';
import { TracesHeader } from './TracesHeader';
import { TracesIndividualContainer } from './TracesIndividualContainer';

export default function TracesPage({ params }: { params: { sessionId: string } }) {
  const sessionId = '77782557-8377-482a-940f-28bb3b292332';
  const { data: trace, isFetched, isError } = useGetSession(sessionId);

  return (
    <>
      <TracesHeader trace={trace} />
      <TracesIndividualContainer
        trace={trace}
        sessionId={sessionId}
        isError={isError}
        isFetched={isFetched}
      />
    </>
  );
}
