import type { LibraryAssetListItem } from '@buster/server-shared';
import { Link, type LinkProps } from '@tanstack/react-router';
import React from 'react';
import { assetTypeToIcon } from '@/components/features/icons/assetIcons';
import { getScreenshotSkeleton } from '@/components/features/Skeletons/get-screenshot-skeleton';
import { Avatar } from '@/components/ui/avatar';
import { AppTooltip } from '@/components/ui/tooltip';
import { Text } from '@/components/ui/typography';
import { assetTypeLabel } from '@/lib/assets/asset-translations';
import { formatDate } from '@/lib/date';
import { createSimpleAssetRoute } from '@/lib/routes/createSimpleAssetRoute';
import { cn } from '@/lib/utils';

interface AssetGridItemProps extends LibraryAssetListItem {
  ContextMenu?: React.ComponentType<React.PropsWithChildren<LibraryAssetListItem>>;
}

export const AssetGridItem = React.memo((props: AssetGridItemProps) => {
  const {
    asset_id,
    asset_type,
    name,
    updated_at,
    screenshot_url,
    ContextMenu,
    created_by_avatar_url,
    created_by_name,
  } = props;
  const imageUrl = screenshot_url ?? getScreenshotSkeleton(asset_type);
  const link = createSimpleAssetRoute({
    asset_type,
    id: asset_id,
  }) as LinkProps;
  const Icon = assetTypeToIcon(asset_type);
  const assetLabel = assetTypeLabel(asset_type);

  const cardContent = (
    <Link {...link} preload={false} className="h-full">
      <div className="group border rounded cursor-pointer hover:border-gray-dark! overflow-hidden h-full flex flex-col">
        <div
          className={cn(
            'px-2.5 flex-1 pt-1.5 bg-item-select overflow-hidden',
            'max-h-[125px] min-h-[125px] h-[125px] '
          )}
        >
          <img
            src={imageUrl}
            alt={name}
            className={cn('w-full h-full object-cover object-top rounded-t-sm bg-background')}
          />
        </div>
        <div className="h-[60px] px-3 flex flex-col space-y-0.5 border-t group-hover:bg-item-hover/10 flex-shrink-0 justify-center bg-background">
          <Text className="line-clamp-2 break-words whitespace-pre-line">{name}</Text>
          <div className="flex items-center space-x-2 text-xs text-text-tertiary">
            <MetaWrapper
              icon={
                <Avatar
                  image={created_by_avatar_url}
                  name={created_by_name}
                  size={12}
                  className="text-[6px] translate-y-[0.5px]"
                />
              }
            >
              <Text variant={'tertiary'} size="sm">
                {created_by_name}
              </Text>
            </MetaWrapper>

            <MetaWrapper icon={<Icon />}>
              <Text variant={'tertiary'} size="sm">
                {assetLabel}
              </Text>
            </MetaWrapper>
          </div>
        </div>
      </div>
    </Link>
  );

  if (ContextMenu) {
    return <ContextMenu {...props}>{cardContent}</ContextMenu>;
  }

  return cardContent;
});

AssetGridItem.displayName = 'AssetGridItem';

const MetaWrapper = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => {
  return (
    <div className="flex gap-x-1 items-center leading-0 h-4.5">
      {icon}
      {children}
    </div>
  );
};
