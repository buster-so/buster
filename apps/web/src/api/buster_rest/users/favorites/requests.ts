import type { ShareAssetType } from '@buster/server-shared/share';
import type { UserFavoriteResponse } from '@buster/server-shared/user';
import { mainApiV2 } from '../../instances';

export const getUserFavorites = async () => {
  return mainApiV2.get<UserFavoriteResponse>('/users/favorites').then((response) => response.data);
};

export const createUserFavorite = async (
  payload: {
    id: string;
    asset_type: ShareAssetType;
    index?: number;
    name: string; //just used for the UI for optimistic update
  }[]
) => {
  return mainApiV2
    .post<UserFavoriteResponse>('/users/favorites', payload)
    .then((response) => response.data);
};

export const deleteUserFavorite = async (data: string[]) => {
  return mainApiV2
    .delete<UserFavoriteResponse>('/users/favorites', { data })
    .then((response) => response.data);
};

export const updateUserFavorites = async (payload: string[]) => {
  return mainApiV2
    .put<UserFavoriteResponse>('/users/favorites', payload)
    .then((response) => response.data);
};
