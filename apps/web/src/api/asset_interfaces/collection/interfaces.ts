import type { ShareAssetType, ShareConfig, ShareRole } from '@buster/server-shared/share';

export type BusterCollectionListItem = {
  id: string;
  name: string;
  description: string;
  updated_at: string;
  created_at: string;
  sharing: BusterCollectionSharing;
  owner: {
    avatar_url: string | null;
    id: string;
    name: string;
  };
  member: [];
};

export type BusterCollection = {
  id: string;
  name: string;
  type: string;
  last_opened: string;
  created_at: string;
  owner: {
    avatar_url: string | null;
    id: string;
    name: string;
  };
  assets: null | BusterCollectionItemAsset[];
  created_by: string;
  deleted_at: null;
  permission: ShareRole;
  sharing_key: string;
  updated_at: string;
  updated_by: string;
} & ShareConfig;

export type BusterCollectionItemAsset = {
  asset_type: ShareAssetType;
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  created_by: {
    email: string;
    name: string;
    avatar_url: string;
  };
};

export enum BusterCollectionSharing {
  PRIVATE = 'private',
  VIEW = 'view',
  EDIT = 'edit',
}
