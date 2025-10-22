import type { BusterCollection, GetCollectionsResponse } from '@buster/server-shared/collections';
import { queryOptions } from '@tanstack/react-query';
import type { collectionsGetList as collectionsGetListRequest } from '@/api/buster_rest/collections/requests';

const collectionsGetList = (
  filters?: Omit<Parameters<typeof collectionsGetListRequest>[0], 'page' | 'page_size'>
) =>
  queryOptions<GetCollectionsResponse>({
    queryKey: ['collections', 'list', filters || { page: 1, page_size: 3500 }] as const,
    staleTime: 60 * 1000,
    initialData: {
      data: [],
      pagination: { page: 1, page_size: 3500, has_more: false },
    },
    initialDataUpdatedAt: 0,
  });

const collectionsGetCollection = (collectionId: string) =>
  queryOptions<BusterCollection>({
    queryKey: ['collections', 'get', collectionId] as const,
  });

export const collectionQueryKeys = {
  collectionsGetList,
  collectionsGetCollection,
};
