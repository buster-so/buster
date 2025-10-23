import type { AssetType } from '@buster/server-shared/assets';
import type { LibraryAssetListItem } from '@buster/server-shared/library';
import { assetTypeToIcon } from '@/components/features/icons/assetIcons';
import { Avatar } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/icons';
import { AssetTypeTranslations } from '@/lib/assets/asset-translations';
import { formatDate } from '@/lib/date';
import type { LibrarySearchParams } from './schema';

export const getGroupMetadata = (
  groupKey: string,
  items: Pick<
    LibraryAssetListItem,
    'created_at' | 'updated_at' | 'created_by_name' | 'created_by_avatar_url' | 'created_by_email'
  >[],
  groupBy: LibrarySearchParams['group_by']
): { title: string; icon: React.ReactNode } => {
  if (groupBy === 'asset_type') {
    const Icon = assetTypeToIcon(groupKey as AssetType);
    return {
      title: AssetTypeTranslations[groupKey as AssetType],
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
