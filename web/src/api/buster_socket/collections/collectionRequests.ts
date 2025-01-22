import { BusterShareAssetType } from '@/api/buster_rest';
import { BusterSocketRequestBase } from '../baseInterfaces';
import { ShareRequest } from '../dashboards';

export type CollectionsListEmit = BusterSocketRequestBase<
  '/collections/list',
  {
    page: number;
    page_size: number;
    shared_with_me?: boolean;
    owned_by_me?: boolean;
  }
>;

export type CollectionGetIndividual = BusterSocketRequestBase<'/collections/get', { id: string }>;

export type CollectionCreateNewCollection = BusterSocketRequestBase<
  '/collections/post',
  {
    name: string;
    description: string;
  }
>;

export type CollectionUpdateCollection = BusterSocketRequestBase<
  '/collections/update',
  {
    id: string;
    name?: string;
    assets?: {
      type: BusterShareAssetType;
      id: string;
    }[];
  } & ShareRequest
>;

export type CollectionDeleteCollection = BusterSocketRequestBase<
  '/collections/delete',
  {
    ids: string[];
  }
>;

export type CollectionsEmit =
  | CollectionsListEmit
  | CollectionGetIndividual
  | CollectionCreateNewCollection
  | CollectionUpdateCollection
  | CollectionDeleteCollection;
