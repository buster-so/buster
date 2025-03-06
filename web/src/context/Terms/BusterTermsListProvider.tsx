import React from 'react';
import { queryKeys } from '@/api/query_keys';
import { useSocketQueryEmitOn } from '@/api/buster_socket_query';
import { createContext, useContextSelector } from 'use-context-selector';
import { useAppLayoutContextSelector } from '../BusterAppLayout';

export const useBusterTermsList = () => {
  const currentSegment = useAppLayoutContextSelector((x) => x.currentSegment);
  const enabled = currentSegment === 'terms';
  const {
    data: termsList,
    refetch: refetchTermsList,
    isFetched: isFetchedTermsList
  } = useSocketQueryEmitOn({
    emitEvent: { route: '/terms/list', payload: { page: 0, page_size: 3000 } },
    responseEvent: '/terms/list:ListTerms',
    options: queryKeys.termsGetList,
    enabledTrigger: enabled
  });

  return {
    termsList,
    refetchTermsList,
    isFetchedTermsList
  };
};

const BusterTermsListContext = createContext<ReturnType<typeof useBusterTermsList>>(
  {} as ReturnType<typeof useBusterTermsList>
);

export const BusterTermsListProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BusterTermsListContext.Provider value={useBusterTermsList()}>
      {children}
    </BusterTermsListContext.Provider>
  );
};

export const useBusterTermsListContextSelector = <T,>(
  selector: (state: ReturnType<typeof useBusterTermsList>) => T
) => useContextSelector(BusterTermsListContext, selector);
