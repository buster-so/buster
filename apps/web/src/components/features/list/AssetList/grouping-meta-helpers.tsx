import type { AssetType } from '@buster/server-shared/assets';
import type { GroupedAssets, LibraryAssetListItem } from '@buster/server-shared/library';
import { assetTypeToIcon } from '@/components/features/icons/assetIcons';
import { Avatar } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/icons';
import { assetTypeLabel } from '@/lib/assets/asset-translations';
import { formatDate } from '@/lib/date';

export const getGroupMetadata = (
  groupKey: keyof GroupedAssets,
  items: Pick<
    LibraryAssetListItem,
    'created_at' | 'updated_at' | 'created_by_name' | 'created_by_avatar_url' | 'created_by_email'
  >[],
  groupBy: 'asset_type' | 'owner' | 'created_at' | 'updated_at' | 'none' | undefined
): { title: string; icon: React.ReactNode } => {
  if (groupBy === 'asset_type' || groupBy === undefined) {
    const Icon = assetTypeToIcon(groupKey);
    console.log(groupKey);
    return {
      title: assetTypeLabel(groupKey),
      icon: <Icon />,
    };
  }

  if (groupBy === 'owner') {
    const firstItem = items[0];
    return {
      title: firstItem.created_by_name ?? firstItem.created_by_email,
      icon: (
        <Avatar
          size={16}
          image={firstItem.created_by_avatar_url}
          name={firstItem.created_by_name}
        />
      ),
    };
  }

  if (groupBy === 'created_at' || groupBy === 'updated_at') {
    const dateField = groupBy === 'created_at' ? items[0].created_at : items[0].updated_at;
    return {
      title: formatDate({ date: dateField, format: 'MMM D, YYYY' }),
      icon: <Calendar />,
    };
  }

  const _exhaustiveCheck: never | 'none' | undefined = groupBy;
  console.error('Exhaustive check failed for groupBy', _exhaustiveCheck);
  return { title: 'Unknown', icon: null };
};
