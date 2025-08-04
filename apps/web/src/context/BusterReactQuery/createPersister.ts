import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { hashKey, isServer } from '@tanstack/react-query';
import type { PersistQueryClientProviderProps } from '@tanstack/react-query-persist-client';
import { queryKeys } from '@/api/query_keys';
import packageJson from '../../../package.json';

const buster = packageJson.version;

export const PERSIST_TIME = 1000 * 60 * 60 * 24 * 7; // 7 days

export const PERSISTED_QUERIES = [queryKeys.slackGetChannels.queryKey].map(hashKey);

export const PERMANENT_QUERIES = [
  queryKeys.getCurrencies.queryKey,
  queryKeys.colorPalettes.queryKey
].map(hashKey);

const ALL_PERSISTED_QUERIES = [...PERSISTED_QUERIES, ...PERMANENT_QUERIES];

const persister = createSyncStoragePersister({
  key: 'buster-query-cache',
  storage: isServer ? undefined : window.localStorage,
  throttleTime: 1500, // 1.5 seconds,
  serialize: (client) => {
    /*
     * Make persisted queries appear stale on first load by setting the dataUpdatedAt to 1 (NOT 0)
     * This way the query will be refetched from the server when it is first mounted AND we
     * don't have to deal with the flash of stale data that would otherwise happen.
     */
    for (const query of client.clientState.queries) {
      const isPermanentQuery = PERMANENT_QUERIES.includes(query.queryHash);
      if (!isPermanentQuery) {
        query.state.dataUpdatedAt = 1;
      }
    }
    return JSON.stringify(client);
  }
});

export const persistOptions: PersistQueryClientProviderProps['persistOptions'] = {
  persister: persister,
  maxAge: PERSIST_TIME,
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => {
      const isList =
        query.queryKey[1] === 'list' || query.queryKey[query.queryKey.length - 1] === 'list';
      return isList || ALL_PERSISTED_QUERIES.includes(query.queryHash);
    }
  },
  hydrateOptions: {
    defaultOptions: {
      queries: {
        initialDataUpdatedAt: 0
      }
    }
  },
  buster: buster
};
