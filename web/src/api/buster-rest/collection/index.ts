import { ShareRole } from '@/api/buster-socket/threads';
import { BusterShareAssetType } from '../users';
import { BusterShare } from '../threads';

export interface BusterCollectionListItem {
  id: string;
  name: string;
  description: string;
  last_edited: string;
  created_at: string;
  sharing: BusterCollectionSharing;
  owner: {
    avatar_url: string | null;
    id: string;
    name: string;
  };
  member: any[];
}

export interface BusterCollection extends BusterShare {
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
}

export interface BusterCollectionItemAsset {
  asset_type: BusterShareAssetType;
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  created_by: {
    email: string;
    name: string;
    avatar_url: string;
  };
}

export enum BusterCollectionSharing {
  PRIVATE = 'private',
  VIEW = 'view',
  EDIT = 'edit'
}
