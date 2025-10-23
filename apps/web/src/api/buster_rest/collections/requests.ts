import type {
  AddAndRemoveFromCollectionResponse,
  AddAssetToCollectionRequestBody,
  BusterCollection,
  CreateCollectionRequestBody,
  DeleteCollectionRequestBody,
  GetCollectionsRequestQuery,
  GetCollectionsResponse,
  GetIndividualCollectionRequestParams,
  UpdateCollectionRequestBody,
} from '@buster/server-shared/collections';
import type {
  ShareDeleteRequest,
  SharePostRequest,
  ShareUpdateRequest,
} from '@buster/server-shared/share';
import mainApi from '@/api/buster_rest/instances';

export const collectionsGetList = async (params: GetCollectionsRequestQuery) => {
  return await mainApi
    .get<GetCollectionsResponse>('/collections', { params })
    .then((res) => res.data);
};

export const collectionsGetCollection = async ({
  id,
  ...params
}: GetIndividualCollectionRequestParams) => {
  return await mainApi
    .get<BusterCollection>(`/collections/${id}`, { params })
    .then((res) => res.data);
};

export const collectionsCreateCollection = async (params: CreateCollectionRequestBody) => {
  return await mainApi.post<BusterCollection>('/collections', params).then((res) => res.data);
};

export const collectionsUpdateCollection = async (params: UpdateCollectionRequestBody) => {
  return await mainApi
    .put<BusterCollection>(`/collections/${params.id}`, params)
    .then((res) => res.data);
};

export const collectionsDeleteCollection = async (data: DeleteCollectionRequestBody) => {
  return await mainApi
    .delete<BusterCollection>('/collections', {
      data,
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
  id,
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
  assets,
}: {
  id: string;
} & AddAssetToCollectionRequestBody) => {
  return mainApi
    .post<AddAndRemoveFromCollectionResponse>(`/collections/${id}/assets`, { assets })
    .then((res) => res.data);
};

export const removeAssetFromCollection = async ({
  id,
  assets,
}: Parameters<typeof addAssetToCollection>[0]) => {
  return mainApi
    .delete<AddAndRemoveFromCollectionResponse>(`/collections/${id}/assets`, { data: { assets } })
    .then((res) => res.data);
};
