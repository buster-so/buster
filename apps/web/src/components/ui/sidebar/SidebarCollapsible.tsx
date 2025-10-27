import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link } from '@tanstack/react-router';
import React, { useEffect } from 'react';
import { Popover } from '@/components/ui/popover';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { useMounted } from '@/hooks/useMount';
import { cn } from '@/lib/classMerge';
import {
  Collapsible,
  CollapsibleContent as CollapsibleContentBase,
  CollapsibleTrigger,
} from '../collapsible/CollapsibleBase';
import { CaretDown } from '../icons/NucleoIconFilled';
import { COLLAPSED_HIDDEN } from './config';
import type { ISidebarGroup } from './interfaces';
import { useSidebarIsCollapsed } from './SidebarContext';
import { SidebarItem } from './SidebarItem';
import { setCollapsibleCookie } from './sidebar-helpers';

const modifiers = [restrictToVerticalAxis];

type SidebarTriggerProps = {
  isOpen: boolean;
  useCollapsible: boolean;
} & Pick<ISidebarGroup, 'link' | 'icon' | 'label' | 'triggerClassName'>;

interface SortableSidebarItemProps {
  item: ISidebarGroup['items'][0];
  active?: boolean;
  isDragging?: boolean;
}

export const SidebarCollapsible: React.FC<
  ISidebarGroup & {
    useCollapsible?: boolean;
    activeItem?: string;
    onItemsReorder?: (ids: string[]) => void;
  }
> = React.memo(
  ({
    label,
    items,
    isSortable = false,
    activeItem,
    onItemsReorder,
    variant = 'collapsible',
    icon,
    defaultOpen = true,
    useCollapsible = true,
    triggerClassName,
    className,
    link,
    id,
  }) => {
    // Track client mount to avoid SSR/CSR hydration mismatches for dnd-kit generated attributes
    const isMounted = useMounted();
    const isSidebarCollapsed = useSidebarIsCollapsed();

    const [isOpen, setIsOpen] = React.useState(defaultOpen);
    const isOpenComputed = isOpen && !isSidebarCollapsed;

    if (isSidebarCollapsed) {
      return (
        <SidebarSmallWidthContent
          activeItem={activeItem}
          items={items}
          icon={icon}
          label={label}
          link={link}
          isSortable={isSortable}
          onItemsReorder={onItemsReorder}
          id={id}
        />
      );
    }

    return (
      <Collapsible
        open={isOpenComputed}
        onOpenChange={(v) => {
          setIsOpen(v);
          setCollapsibleCookie(id, v);
        }}
        className={cn('space-y-0.5', className)}
      >
        {variant === 'collapsible' && (
          <SidebarTrigger
            label={label}
            isOpen={isOpen}
            icon={icon}
            link={link}
            useCollapsible={useCollapsible}
            triggerClassName={triggerClassName}
          />
        )}

        {variant === 'icon' && (
          <div
            className={cn(
              'flex items-center space-x-2.5 px-1.5 py-1 text-base',
              'text-text-secondary'
            )}
          >
            {icon && <span className="text-icon-color text-icon-size">{icon}</span>}
            <span className="">{label}</span>
          </div>
        )}

        <CollapsibleContentBase
          className={cn(
            isMounted &&
              'data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up'
          )}
          style={{
            minHeight:
              !isMounted && isOpen ? `${items.length * 28 + items.length * 2 - 2}px` : undefined,
          }}
        >
          <CollapsibleContent
            items={items}
            isMounted={isMounted}
            isSortable={isSortable}
            activeItem={activeItem}
            onItemsReorder={onItemsReorder}
            showSidebar={true}
          />
        </CollapsibleContentBase>
      </Collapsible>
    );
  }
);

SidebarCollapsible.displayName = 'SidebarCollapsible';

const SortableSidebarItem: React.FC<SortableSidebarItemProps> = ({
  item,
  active,
  isDragging: isExternalDragging,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: item.disabled,
  });

  // When showSidebar=false (in popover), don't use opacity since we won't show DragOverlay
  const shouldShowPlaceholder = isExternalDragging !== undefined ? isExternalDragging : isDragging;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: shouldShowPlaceholder ? 0.4 : 1,
  };

  const handleClick = useMemoizedFn((e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={cn(
        isDragging && 'pointer-events-none',
        shouldShowPlaceholder && 'cursor-grabbing'
      )}
    >
      <div onClick={isDragging ? (e) => e.stopPropagation() : undefined}>
        <SidebarItem {...item} active={active} />
      </div>
    </div>
  );
};

const SidebarTrigger: React.FC<SidebarTriggerProps> = ({
  icon,
  label,
  isOpen,
  link,
  useCollapsible,
  triggerClassName,
}) => {
  const containerClasses = cn(
    useCollapsible && COLLAPSED_HIDDEN,
    'flex items-center gap-2.5 rounded px-1.5 py-1 text-base transition-colors',
    'text-foreground hover:bg-nav-item-hover w-full',
    'group min-h-7',
    !link && 'cursor-pointer',
    triggerClassName
  );

  const iconContent = (
    <>
      {icon && <span className="group-hover:hidden flex text-icon-size">{icon}</span>}
      <span
        className={cn(
          'hover:bg-gray-light/20 p-1 rounded-sm text-xs',
          icon && 'group-hover:flex hidden'
        )}
      >
        <span className={cn('-rotate-90 transition-transform duration-200', isOpen && 'rotate-0')}>
          <CaretDown />
        </span>
      </span>
    </>
  );

  if (link) {
    // When there's a link, only the icon triggers collapse
    return (
      <div className={containerClasses}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className={cn('text-icon-color w-4 flex items-center justify-center cursor-pointer')}
          >
            {iconContent}
          </button>
        </CollapsibleTrigger>
        <Link {...link} className="truncate flex-1">
          {label}
        </Link>
      </div>
    );
  }

  // When there's no link, the entire component triggers collapse
  return (
    <CollapsibleTrigger className={cn(useCollapsible && COLLAPSED_HIDDEN, 'w-full text-left')}>
      <div className={containerClasses}>
        <div className={cn('text-icon-color w-4 flex items-center justify-center')}>
          {iconContent}
        </div>
        <span className="truncate">{label}</span>
      </div>
    </CollapsibleTrigger>
  );
};
SidebarTrigger.displayName = 'SidebarTrigger';

const CollapsibleContent = ({
  items,
  onItemsReorder,
  isMounted,
  isSortable,
  activeItem,
  showSidebar,
  className,
}: {
  items: ISidebarGroup['items'];
  onItemsReorder?: (ids: string[]) => void;
  isMounted: boolean;
  isSortable: boolean;
  activeItem?: string;
  showSidebar: boolean;
  className?: string;
}) => {
  const [sortedItems, setSortedItems] = React.useState(items);
  const [draggingId, setDraggingId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useMemoizedFn((event: DragStartEvent) => {
    setDraggingId(event.active.id as string);
  });

  const handleDragEnd = useMemoizedFn((event: DragEndEvent) => {
    const { active, over } = event;
    setDraggingId(null);

    if (active.id !== over?.id) {
      setSortedItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        const moveddArray = arrayMove(items, oldIndex, newIndex);
        onItemsReorder?.(moveddArray.map((item) => item.id));
        return moveddArray;
      });
    }
  });

  const draggingItem = draggingId ? sortedItems.find((item) => item.id === draggingId) : null;

  useEffect(() => {
    setSortedItems(items);
  }, [items]);

  return (
    <div className={cn('relative gap-y-0.5 flex flex-col ', showSidebar && 'pl-6.5', className)}>
      {showSidebar && <div className="absolute left-3.5 top-0 bottom-0 w-px bg-border" />}

      {isMounted && isSortable ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          modifiers={modifiers}
        >
          <SortableContext
            items={sortedItems.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            {sortedItems.map((item) => (
              <SortableSidebarItem
                key={item.id}
                item={item}
                active={activeItem === item.id || item.active}
                isDragging={draggingId === item.id}
              />
            ))}
          </SortableContext>
          {showSidebar && (
            <DragOverlay dropAnimation={null}>
              {draggingId && draggingItem ? (
                <div className="opacity-70 shadow">
                  <SidebarItem {...draggingItem} active={draggingItem.active} />
                </div>
              ) : null}
            </DragOverlay>
          )}
        </DndContext>
      ) : (
        items.map((item) => (
          <SidebarItem key={item.id} {...item} active={activeItem === item.id || item.active} />
        ))
      )}
    </div>
  );
};

//This is used to display the sidebar content when the sidebar is collapsed
const SidebarSmallWidthContent: React.FC<
  Pick<
    ISidebarGroup,
    'items' | 'icon' | 'label' | 'link' | 'isSortable' | 'onItemsReorder' | 'id'
  > & { activeItem?: string }
> = ({ items, icon, link, isSortable = false, id, onItemsReorder, activeItem }) => {
  const trigger = link ? 'click' : 'click';

  return (
    <Popover
      trigger={trigger}
      align="start"
      side="right"
      modal={false}
      disablePortal={true}
      content={
        <CollapsibleContent
          items={items}
          isMounted={true}
          isSortable={isSortable}
          activeItem={activeItem}
          onItemsReorder={onItemsReorder}
          showSidebar={false}
          className="max-w-[320px] min-w-[180px]"
        />
      }
    >
      <div
        data-testid={`sidebar-collapsible-${id}`}
        className={cn(
          'flex flex-col space-y-0.5 h-7 overflow-y-auto',
          'text-icon-color! text-icon-size flex items-center justify-center',
          'hover:bg-nav-item-hover w-full rounded-sm cursor-pointer'
        )}
      >
        {icon}
      </div>
    </Popover>
  );
};
