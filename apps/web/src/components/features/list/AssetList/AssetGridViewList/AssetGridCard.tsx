import type { LibraryAssetListItem } from '@buster/server-shared';
import { Link, type LinkProps } from '@tanstack/react-router';
import React from 'react';
import { getScreenshotSkeleton } from '@/components/features/Skeletons/get-screenshot-skeleton';
import { Clock } from '@/components/ui/icons';
import { Text } from '@/components/ui/typography';
import { formatDate } from '@/lib/date';
import { createSimpleAssetRoute } from '@/lib/routes/createSimpleAssetRoute';
import { cn } from '@/lib/utils';
import type { AssetGridViewListProps } from '../AssetList.types';

export const AssetGridItem = React.memo(
  (props: LibraryAssetListItem & Pick<AssetGridViewListProps, 'ContextMenu'>) => {
    const { asset_id, asset_type, ContextMenu, name, updated_at, screenshot_url } = props;
    const imageUrl = screenshot_url ?? getScreenshotSkeleton(asset_type);
    const link = createSimpleAssetRoute({
      asset_type,
      id: asset_id,
    }) as LinkProps;

    return (
      <ContextMenu {...props}>
        <Link {...link} preload={false} className="h-full">
          <div className="group border rounded cursor-pointer hover:bg-item-hover-active hover:border-gray-dark! overflow-hidden h-full flex flex-col">
            <div
              className={cn(
                'px-2.5 flex-1 pt-1.5 bg-item-select overflow-hidden',
                'max-h-[125px] min-h-[125px] h-[125px] '
              )}
            >
              <img
                src={imageUrl}
                alt={name}
                className={cn('w-full h-full object-contain object-top rounded-t-sm bg-background')}
              />
            </div>
            <div className="h-[60px] px-3 flex flex-col space-y-0.5 border-t group-hover:bg-item-hover flex-shrink-0 justify-center bg-background">
              <Text className="line-clamp-2 break-words whitespace-pre-line">{name}</Text>
              <div className="flex items-center space-x-1 text-xs text-text-tertiary">
                <Clock />
                <Text variant={'tertiary'} size="sm">
                  {formatDate({
                    date: updated_at,
                    format: 'MMM D',
                  })}
                </Text>
              </div>
            </div>
          </div>
        </Link>
      </ContextMenu>
    );
  }
);

AssetGridItem.displayName = 'AssetGridItem';
