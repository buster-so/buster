import { useMemoizedFn } from 'ahooks';
import React from 'react';
import { useBusterWebSocket } from '../BusterWebSocket';
import { BusterSearchResult } from '@/api/buster_rest';
import { BusterSearchRequest } from '@/api/buster_socket/search';
import { allBusterSearchRequestKeys } from './config';
import {
  createContext,
  ContextSelector,
  useContextSelector
} from '@fluentui/react-context-selector';

export const useBusterSearch = () => {
  const busterSocket = useBusterWebSocket();

  const onBusterSearch = useMemoizedFn(
    async ({
      query,
      include,
      exclude
    }: {
      include?: (keyof BusterSearchRequest['payload'])[];
      exclude?: (keyof BusterSearchRequest['payload'])[];
      query: string;
    }) => {
      const reducedParams = allBusterSearchRequestKeys.reduce((acc, curr) => {
        const value = include?.includes(curr) && !exclude?.includes(curr) ? true : false;
        return { ...acc, [curr]: !value };
      }, {});
      const payload: BusterSearchRequest['payload'] = {
        query,
        ...reducedParams
      };

      const callback = (d: BusterSearchResult[]) => {
        return d || [];
      };

      const res = await busterSocket.emitAndOnce({
        emitEvent: {
          route: '/search',
          payload
        },
        responseEvent: {
          route: '/search:search',
          callback,
          onError: (e) => {}
        }
      });
      return res as BusterSearchResult[];
    }
  );

  return { onBusterSearch };
};

const BusterSearch = createContext<ReturnType<typeof useBusterSearch>>(
  {} as ReturnType<typeof useBusterSearch>
);

export const BusterSearchProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const value = useBusterSearch();

  return <BusterSearch.Provider value={value}>{children}</BusterSearch.Provider>;
};

export const useBusterSearchContextSelector = <T,>(
  selector: ContextSelector<ReturnType<typeof useBusterSearch>, T>
) => useContextSelector(BusterSearch, selector);
