import type { AssetGetResponse, GetAssetsRequestQuery } from '@buster/server-shared/library';
import { mainApiV2 } from '../instances';

export const getSharingAssets = async (filters: GetAssetsRequestQuery) => {
  return mainApiV2.get<AssetGetResponse>('/sharing', { params: filters }).then((res) => res.data);
};
