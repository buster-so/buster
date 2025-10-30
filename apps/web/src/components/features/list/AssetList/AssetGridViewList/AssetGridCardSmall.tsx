import type { BusterCollectionListItem } from '@buster/server-shared/collections';
import type { LibraryAssetListItem } from '@buster/server-shared/library';
import { Link, type LinkProps } from '@tanstack/react-router';
import { cn } from '@udecode/cn';
import React from 'react';
import { useDeleteCollection } from '@/api/buster_rest/collections';
import { Avatar } from '@/components/ui/avatar';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Trash } from '@/components/ui/icons';
import { Text } from '@/components/ui/typography';
import { formatDate } from '@/lib/date';
import { createSimpleAssetRoute } from '@/lib/routes/createSimpleAssetRoute';

export const AssetGridCardSmall = React.memo(
  ({
    asset_id,
    asset_type,
    name,
    updated_at,
    created_by_avatar_url,
    created_by_name,
    ContextMenu,
  }: LibraryAssetListItem & {
    ContextMenu: React.FC<React.PropsWithChildren>;
  }) => {
    const Wrapper = ({ children }: { children: React.ReactNode }) => {
      if (ContextMenu) {
        return <ContextMenu>{children}</ContextMenu>;
      }

      return <>{children}</>;
    };

    const link = createSimpleAssetRoute({
      asset_type,
      id: asset_id,
    }) as LinkProps;

    return (
      <Wrapper>
        <Link {...link}>
          <div
            className={cn(
              'flex flex-col gap-y-2 h-21 border rounded py-2.5 px-3 justify-between',
              'cursor-pointer hover:border-gray-dark bg-background'
            )}
          >
            <Text variant={'default'} className="line-clamp-2" size={'base'}>
              {name}
            </Text>
            <div className="flex items-center space-x-1">
              <Avatar
                image={created_by_avatar_url || undefined}
                name={created_by_name || undefined}
                size={12}
                className="text-xs"
              />
              <Text variant={'tertiary'} size={'xs'}>
                {formatDate({ date: updated_at, format: 'MMM D' })}
              </Text>
            </div>
          </div>
        </Link>
      </Wrapper>
    );
  }
);

AssetGridCardSmall.displayName = 'AssetGridCardSmall';
