import type { BusterCollectionListItem } from '@buster/server-shared/collections';
import { Link } from '@tanstack/react-router';
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

export const CollectionCard = React.memo(
  ({ id, name, updated_at, created_by_avatar_url, created_by_name }: BusterCollectionListItem) => {
    return (
      <CollectionCardContextMenu id={id}>
        <Link to="/app/collections/$collectionId" params={{ collectionId: id }}>
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
              />
              <Text variant={'tertiary'} size={'xs'}>
                {formatDate({ date: updated_at, format: 'MMM D' })}
              </Text>
            </div>
          </div>
        </Link>
      </CollectionCardContextMenu>
    );
  }
);

CollectionCard.displayName = 'CollectionCard';

const CollectionCardContextMenu = React.memo(
  ({
    id,
    children,
  }: Pick<BusterCollectionListItem, 'id'> & {
    children: React.ReactNode;
  }) => {
    const { mutateAsync: onDeleteCollection } = useDeleteCollection();

    return (
      <ContextMenu modal={false}>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="p-1 border rounded">
          <ContextMenuItem
            icon={<Trash />}
            onClick={() => onDeleteCollection({ id, useConfirmModal: false })}
          >
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  }
);
