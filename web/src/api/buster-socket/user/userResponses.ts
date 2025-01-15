import {
  BusterUserFavorite,
  BusterUserListItem,
  BusterUserPalette,
  BusterUserResponse,
  BusterUserTeamListItem
} from '@/api/buster-rest';

export enum UserResponses {
  '/users/colors/list:listUserColorPalettes' = '/users/colors/list:listUserColorPalettes',
  '/users/colors/post:createUserColorPalette' = '/users/colors/post:createUserColorPalette',
  '/users/favorites/list:listFavorites' = '/users/favorites/list:listFavorites',
  '/users/favorites/post:createFavorite' = '/users/favorites/post:createFavorite',
  '/users/get:getUser' = '/users/get:getUser',
  '/users/favorites/update:updateFavorite' = '/users/favorites/update:updateFavorite',
  '/users/list:listUsersTeams' = '/users/list:listUsersTeams',
  '/users/list:listUsers' = '/users/list:listUsers'
}

export type UserColorsList_listUserColorPalettes = {
  route: '/users/colors/list:listUserColorPalettes';
  callback: (d: BusterUserPalette[]) => void;
  onError?: (d: unknown) => void;
};

export type UserColorsPost_createUserColorPalette = {
  route: '/users/colors/post:createUserColorPalette';
  callback: (d: BusterUserPalette[]) => void;
  onError?: (d: unknown) => void;
};

export type UserFavoriteList_listFavorites = {
  route: '/users/favorites/list:listFavorites';
  callback: (d: BusterUserFavorite[]) => void;
  onError?: (d: unknown) => void;
};

export type UserFavoritesPost_createFavorite = {
  route: '/users/favorites/post:createFavorite';
  callback: (d: BusterUserFavorite[]) => void;
  onError?: (d: unknown) => void;
};

export type UserFavoritesUpdate_updateFavorite = {
  route: '/users/favorites/update:updateFavorite';
  callback: (d: BusterUserFavorite[]) => void;
  onError?: (d: unknown) => void;
};

export type UserGet_getUser = {
  route: '/users/get:getUser';
  callback: (d: BusterUserResponse) => void;
  onError?: (d: unknown) => void;
};

export type UserList_getUserList = {
  route: '/users/list:listUsers';
  callback: (d: BusterUserListItem[]) => void;
  onError?: (d: unknown) => void;
};

export type UserResponsesTypes =
  | UserColorsList_listUserColorPalettes
  | UserColorsPost_createUserColorPalette
  | UserFavoriteList_listFavorites
  | UserFavoritesPost_createFavorite
  | UserGet_getUser
  | UserFavoritesUpdate_updateFavorite
  | UserList_getUserList;
