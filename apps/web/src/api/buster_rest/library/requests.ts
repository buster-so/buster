import type {
  GetLibraryAssetsRequestQuery,
  LibraryDeleteRequestBody,
  LibraryDeleteResponse,
  LibraryGetResponse,
  LibraryPostRequestBody,
  LibraryPostResponse,
} from '@buster/server-shared/library';
import { mainApiV2 } from '../instances';

export const getLibraryAssets = async (filters: GetLibraryAssetsRequestQuery) => {
  return mainApiV2.get<LibraryGetResponse>('/library', { params: filters }).then((res) => res.data);
};

export const postLibraryAssets = async (assets: LibraryPostRequestBody) => {
  return mainApiV2.post<LibraryPostResponse>('/library', assets).then((res) => res.data);
};

export const deleteLibraryAssets = async (assets: LibraryDeleteRequestBody) => {
  return mainApiV2
    .delete<LibraryDeleteResponse>('/library', { params: assets })
    .then((res) => res.data);
};
