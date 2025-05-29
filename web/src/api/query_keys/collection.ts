import { queryOptions } from '@tanstack/react-query';
import type { BusterCollection, BusterCollectionListItem } from '@/api/asset_interfaces/collection';
import type { collectionsGetList as collectionsGetListRequest } from '@/api/buster_rest/collections/requests';

const collectionsGetList = (
  filters?: Omit<Parameters<typeof collectionsGetListRequest>[0], 'page_token' | 'page_size'>
) =>
  queryOptions<BusterCollectionListItem[]>({
    queryKey: ['collections', 'list', filters || { page_token: 0, page_size: 3500 }] as const,
    staleTime: 60 * 1000,
    initialData: [],
    initialDataUpdatedAt: 0
  });

const collectionsGetCollection = (collectionId: string) =>
  queryOptions<BusterCollection>({
    queryKey: ['collections', 'get', collectionId] as const
  });

export const collectionQueryKeys = {
  collectionsGetList,
  collectionsGetCollection
};
