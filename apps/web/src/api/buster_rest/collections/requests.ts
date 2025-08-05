import type { ShareAssetType } from '@buster/server-shared/share';
import type { BusterCollection, BusterCollectionListItem } from '@/api/asset_interfaces/collection';
import mainApi from '@/api/buster_rest/instances';
import { SharePostRequest } from '@buster/server-shared/share';
import type { ShareDeleteRequest, ShareUpdateRequest } from '@buster/server-shared/share';

export const collectionsGetList = async (params: {
  /** Current page number (1-based indexing) */
  page_token: number;
  /** Number of items to display per page */
  page_size: number;
  /** When true, returns only collections shared with the current user */
  shared_with_me?: boolean;
  /** When true, returns only collections owned by the current user */
  owned_by_me?: boolean;
}) => {
  return await mainApi
    .get<BusterCollectionListItem[]>('/collections', { params })
    .then((res) => res.data);
};

export const collectionsGetCollection = async ({
  id,
  ...params
}: {
  /** Unique identifier of the collection to retrieve */
  id: string;
  /** Password for the collection */
  password?: string;
}) => {
  return await mainApi
    .get<BusterCollection>(`/collections/${id}`, { params })
    .then((res) => res.data);
};

export const collectionsCreateCollection = async (params: {
  /** Name of the new collection */
  name: string;
  /** Description detailing the purpose or contents of the collection */
  description: string;
}) => {
  return await mainApi.post<BusterCollection>('/collections', params).then((res) => res.data);
};

export const collectionsUpdateCollection = async (params: {
  /** Unique identifier of the collection to update */
  id: string;
  /** Optional new name for the collection */
  name?: string;
  /** Optional array of assets to be associated with the collection */
  assets?: {
    /** Type of the asset being added */
    type: ShareAssetType;
    /** Unique identifier of the asset */
    id: string;
  }[];
  /** Share request parameters */
  share_with?: string[];
  share_type?: string;
}) => {
  return await mainApi
    .put<BusterCollection>(`/collections/${params.id}`, params)
    .then((res) => res.data);
};

export const collectionsDeleteCollection = async (data: {
  /** Array of collection IDs to be deleted */
  ids: string[];
}) => {
  return await mainApi
    .delete<BusterCollection>('/collections', {
      data
    })
    .then((res) => res.data);
};

// share collections

export const shareCollection = async ({ id, params }: { id: string; params: SharePostRequest }) => {
  return mainApi.post<string>(`/collections/${id}/sharing`, params).then((res) => res.data);
};

export const unshareCollection = async ({ id, data }: { id: string; data: ShareDeleteRequest }) => {
  return mainApi
    .delete<BusterCollection>(`/collections/${id}/sharing`, { data })
    .then((res) => res.data);
};

export const updateCollectionShare = async ({
  params,
  id
}: {
  id: string;
  params: ShareUpdateRequest;
}) => {
  return mainApi
    .put<BusterCollection>(`/collections/${id}/sharing`, params)
    .then((res) => res.data);
};

export const addAssetToCollection = async ({
  id,
  assets
}: {
  id: string;
  assets: {
    type: Exclude<ShareAssetType, 'collection'>;
    id: string;
  }[];
}) => {
  return mainApi.post<null>(`/collections/${id}/assets`, { assets }).then((res) => res.data);
};

export const removeAssetFromCollection = async ({
  id,
  assets
}: Parameters<typeof addAssetToCollection>[0]) => {
  return mainApi
    .delete<null>(`/collections/${id}/assets`, { data: { assets } })
    .then((res) => res.data);
};
