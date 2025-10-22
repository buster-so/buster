import { Link } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';
import type { BusterCollectionListItem } from '@/api/asset_interfaces/collection';
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
import { cn } from '@/lib/utils';

interface LibraryCollectionsScrollerProps {
  collections: BusterCollectionListItem[];
}

export const LibraryCollectionsScroller = React.memo(
  ({ collections }: LibraryCollectionsScrollerProps) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeftGradient, setShowLeftGradient] = useState(false);
    const [showRightGradient, setShowRightGradient] = useState(false);

    useEffect(() => {
      const checkScrollPosition = () => {
        if (scrollContainerRef.current) {
          const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;

          // Show left gradient if scrolled from start
          setShowLeftGradient(scrollLeft > 0);

          // Show right gradient if not scrolled to end and content is overflowing
          setShowRightGradient(scrollLeft + clientWidth < scrollWidth - 1);
        }
      };

      checkScrollPosition();

      const resizeObserver = new ResizeObserver(checkScrollPosition);
      const scrollContainer = scrollContainerRef.current;

      if (scrollContainer) {
        resizeObserver.observe(scrollContainer);
        scrollContainer.addEventListener('scroll', checkScrollPosition);
      }

      return () => {
        resizeObserver.disconnect();
        if (scrollContainer) {
          scrollContainer.removeEventListener('scroll', checkScrollPosition);
        }
      };
    }, [collections]);

    const commonGradientClasses = 'w-15 h-full absolute top-0 pointer-events-none';

    return (
      <div className="relative">
        <div
          className="flex flex-nowrap gap-4 overflow-x-auto scrollbar-none"
          ref={scrollContainerRef}
        >
          {collections.map((collection) => (
            <CollectionCard key={collection.id} {...collection} />
          ))}
        </div>
        <AnimatePresence>
          {showLeftGradient && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                commonGradientClasses,
                'left-0 bg-gradient-to-r from-page-background to-transparent'
              )}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showRightGradient && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                commonGradientClasses,
                'right-0 bg-gradient-to-l from-page-background to-transparent'
              )}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }
);

LibraryCollectionsScroller.displayName = 'LibraryCollectionsScroller';

const CollectionCard = React.memo(
  ({ id, name, updated_at, created_by_avatar_url, created_by_name }: BusterCollectionListItem) => {
    return (
      <CollectionCardContextMenu id={id}>
        <Link to="/app/collections/$collectionId" params={{ collectionId: id }}>
          <div
            className={cn(
              'flex flex-col gap-y-2 h-21 min-w-36 w-36 border rounded py-2.5 px-3 justify-between',
              'cursor-pointer hover:bg-item-hover'
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
