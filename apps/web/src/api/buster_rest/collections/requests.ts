import type {
  AddAndRemoveFromCollectionResponse,
  AddOrRemoveAssetToCollectionRequestBody,
  BusterCollection,
  CreateCollectionRequestBody,
  DeleteCollectionRequestBody,
  DeleteCollectionsResponse,
  GetCollectionsRequestQuery,
  GetCollectionsResponse,
  GetIndividualCollectionRequestParams,
  UpdateCollectionRequestBody,
} from '@buster/server-shared/collections';
import type {
  ShareDeleteRequest,
  ShareDeleteResponse,
  SharePostRequest,
  SharePostResponse,
  ShareUpdateRequest,
} from '@buster/server-shared/share';
import { mainApiV2 } from '../instances';

export const collectionsGetList = async (params: GetCollectionsRequestQuery) => {
  return await mainApiV2
    .get<GetCollectionsResponse>('/collections', { params })
    .then((res) => res.data);
};

export const collectionsGetCollection = async ({ id }: GetIndividualCollectionRequestParams) => {
  return await mainApiV2.get<BusterCollection>(`/collections/${id}`).then((res) => res.data);
};

export const collectionsCreateCollection = async (params: CreateCollectionRequestBody) => {
  return await mainApiV2.post<BusterCollection>('/collections', params).then((res) => res.data);
};

export const collectionsUpdateCollection = async (params: UpdateCollectionRequestBody) => {
  return await mainApiV2
    .put<BusterCollection>(`/collections/${params.id}`, params)
    .then((res) => res.data);
};

export const collectionsDeleteCollection = async (data: DeleteCollectionRequestBody) => {
  return await mainApiV2
    .delete<DeleteCollectionsResponse>('/collections', {
      data,
    })
    .then((res) => res.data);
};

// share collections

export const shareCollection = async ({ id, params }: { id: string; params: SharePostRequest }) => {
  return mainApiV2
    .post<SharePostResponse>(`/collections/${id}/sharing`, params)
    .then((res) => res.data);
};

export const unshareCollection = async ({ id, data }: { id: string; data: ShareDeleteRequest }) => {
  return mainApiV2
    .delete<ShareDeleteResponse>(`/collections/${id}/sharing`, { data })
    .then((res) => res.data);
};

export const updateCollectionShare = async ({
  params,
  id,
}: {
  id: string;
  params: ShareUpdateRequest;
}) => {
  return mainApiV2
    .put<BusterCollection>(`/collections/${id}/sharing`, params)
    .then((res) => res.data);
};

export const addAssetToCollection = async ({
  id,
  assets,
}: {
  id: string;
} & AddOrRemoveAssetToCollectionRequestBody) => {
  return mainApiV2
    .post<AddAndRemoveFromCollectionResponse>(`/collections/${id}/assets`, { assets })
    .then((res) => res.data);
};

export const removeAssetFromCollection = async ({
  id,
  assets,
}: {
  id: string;
} & AddOrRemoveAssetToCollectionRequestBody) => {
  return mainApiV2
    .delete<AddAndRemoveFromCollectionResponse>(`/collections/${id}/assets`, { data: { assets } })
    .then((res) => res.data);
};
