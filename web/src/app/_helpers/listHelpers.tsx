import { BusterShareAssetType } from '@/api/buster_rest';
import { AppMaterialIcons } from '@/components';

const iconRecord: Record<BusterShareAssetType, string> = {
  [BusterShareAssetType.COLLECTION]: 'note_stack',
  [BusterShareAssetType.DASHBOARD]: 'grid_view',
  [BusterShareAssetType.THREAD]: 'monitoring'
};

export const asset_typeToIcon = (
  type: BusterShareAssetType,
  props?: { open?: boolean; size?: number }
) => {
  const { open, size } = props || {};
  const iconString = iconRecord[type];
  return <AppMaterialIcons icon={iconString as 'grid_view'} size={size} />;
};

export const asset_typeToTranslation = (type: BusterShareAssetType) => {
  const asset_typeTranslation: Record<BusterShareAssetType, string> = {
    [BusterShareAssetType.COLLECTION]: 'collection',
    [BusterShareAssetType.DASHBOARD]: 'dashboard',
    [BusterShareAssetType.THREAD]: 'thread'
  };
  return asset_typeTranslation[type];
};
