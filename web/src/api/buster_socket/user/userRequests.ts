import { BusterShareAssetType } from '@/api/buster_rest';
import { BusterSocketRequestBase } from '../baseInterfaces';

export type UserColorsList = BusterSocketRequestBase<'/users/colors/list', {}>;

export type UserColorsCreate = BusterSocketRequestBase<
  '/users/colors/post',
  {
    color_palette: string[];
  }
>;

export type UserColorsUpdate = BusterSocketRequestBase<
  '/users/colors/update',
  {
    id: string;
    color_palette: string[];
  }
>;

export type UserColorsDelete = BusterSocketRequestBase<
  '/users/colors/delete',
  {
    id: string;
  }
>;

export type UsersFavoritePost = BusterSocketRequestBase<
  '/users/favorites/post',
  {
    id: string;
    asset_type: BusterShareAssetType;
    index?: number;
  }
>;

export type UsersFavoriteList = BusterSocketRequestBase<'/users/favorites/list', {}>;

export type UserFavoriteDelete = BusterSocketRequestBase<
  '/users/favorites/delete',
  {
    id: string;
    asset_type: BusterShareAssetType;
  }
>;

export type UserUpdateFavorites = BusterSocketRequestBase<
  '/users/favorites/update',
  {
    favorites: string[]; // Array of favorite ids
  }
>;

export type UserRequestUserList = BusterSocketRequestBase<
  '/users/list',
  {
    team_id: string;
    page?: number;
    page_size?: number;
  }
>;

export type UserInvite = BusterSocketRequestBase<
  '/users/invite',
  { emails: string[]; team_ids?: null | string[] }
>;

export type UserEmits =
  | UserColorsList
  | UserColorsCreate
  | UserColorsUpdate
  | UserColorsDelete
  | UsersFavoritePost
  | UsersFavoriteList
  | UserFavoriteDelete
  | UserUpdateFavorites
  | UserRequestUserList
  | UserInvite;
