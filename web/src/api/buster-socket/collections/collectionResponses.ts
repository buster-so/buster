import { BusterCollection, BusterCollectionListItem } from '@/api/buster-rest/collection';

export enum CollectionResponses {
  '/collections/list:listCollections' = '/collections/list:listCollections',
  '/collections/get:collectionState' = '/collections/get:collectionState',
  '/collections/delete:deleteCollections' = '/collections/delete:deleteCollections',
  '/collections/post:collectionState' = '/collections/post:collectionState',
  '/collections/update:collectionState' = '/collections/update:collectionState'
}

export type CollectionResponses_listCollections = {
  route: '/collections/list:listCollections';
  callback: (d: BusterCollectionListItem[]) => void;
  onError?: (d: unknown) => void;
};

export type CollectionResponses_collectionState = {
  route: '/collections/get:collectionState';
  callback: (d: BusterCollection) => void;
  onError?: (d: unknown) => void;
};

export type CollectionPost_collectionState = {
  route: '/collections/post:collectionState';
  callback: (d: BusterCollection) => void;
  onError?: (d: unknown) => void;
};

export type CollectionResponses_updateCollectionState = {
  route: '/collections/update:collectionState';
  callback: (d: BusterCollection) => void;
  onError?: (d: unknown) => void;
};

export type CollectionResponseTypes =
  | CollectionResponses_listCollections
  | CollectionResponses_collectionState
  | CollectionPost_collectionState
  | CollectionResponses_updateCollectionState;
