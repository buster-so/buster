import type { LibraryAssetListItem } from '@buster/server-shared/library';
import { Link, type LinkProps } from '@tanstack/react-router';
import React from 'react';
import { getScreenshotSkeleton } from '@/components/features/Skeletons/get-screenshot-skeleton';
import Clock from '@/components/ui/icons/NucleoIconOutlined/clock';
import { Text } from '@/components/ui/typography/Text';
import { formatDate } from '@/lib/date';
import { createSimpleAssetRoute } from '@/lib/routes/createSimpleAssetRoute';
import { cn } from '@/lib/utils';

const LibraryGridItem = React.memo(
  ({ asset_id, asset_type, name, updated_at, screenshot_url }: LibraryAssetListItem) => {
    const imageUrl = screenshot_url ?? getScreenshotSkeleton(asset_type);
    const link = createSimpleAssetRoute({
      asset_type,
      id: asset_id,
    }) as LinkProps;

    return (
      <Link {...link} preload={false} className="h-full">
        <div className="group border rounded cursor-pointer hover:shadow hover:border-gray-dark hover:bg-item-hover-active overflow-hidden h-full flex flex-col">
          <div className="px-2.5 flex-1 pt-1.5 bg-item-select min-h-[125px] max-h-[125px] overflow-hidden">
            <img
              src={imageUrl}
              alt={name}
              className={cn('w-full h-full object-contain object-top rounded-t-sm bg-background')}
            />
          </div>
          <div className="px-3 pt-2.5 pb-3 flex flex-col space-y-0.5 border-t group-hover:bg-item-hover bg-background">
            <Text>{name}</Text>
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
    );
  }
);

LibraryGridItem.displayName = 'LibraryGridItem';
