import { IndeterminateLinearLoader } from '@/components';
import React from 'react';
import { TracesIndividualContent } from './TracesIndividualContent';
import { type ApiSessionWithTraces } from 'langfuse';

export const TracesIndividualContainer = React.memo(
  ({
    sessionId,
    trace,
    isError,
    isFetched
  }: {
    sessionId: string;
    isError: boolean;
    isFetched: boolean;
    trace: ApiSessionWithTraces | undefined;
  }) => {
    return (
      <>
        {!isFetched && <IndeterminateLinearLoader />}
        {isError && (
          <div className="border-red-600 bg-red-100 p-5 text-red-500">Error loading trace</div>
        )}
        {isFetched && trace && <TracesIndividualContent trace={trace} />}
      </>
    );
  }
);

TracesIndividualContainer.displayName = 'TracesIndividualContainer';
