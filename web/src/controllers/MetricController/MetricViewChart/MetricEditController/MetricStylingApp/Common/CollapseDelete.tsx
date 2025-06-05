import type { DraggableAttributes } from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';
import { Button } from '@/components/ui/buttons';
import { ChevronRight, Trash } from '@/components/ui/icons';
import { Text } from '@/components/ui/typography';
import { useMemoizedFn } from '@/hooks';
import { cn } from '@/lib/classMerge';

const ANIMATION_DURATION = 0.145;

interface DraggingProps {
  isDragging?: boolean;
  style?: React.CSSProperties;
  listeners?: SyntheticListenerMap;
  attributes?: DraggableAttributes;
}

const dropdownAnimationConfig = {
  initial: { height: 0, borderTopWidth: 0, opacity: 0 },
  animate: { height: 'auto', borderTopWidth: 0.5, opacity: 1 },
  exit: { height: 0, borderTopWidth: 0, opacity: 0 },
  transition: {
    duration: ANIMATION_DURATION,
    borderTopWidth: { duration: ANIMATION_DURATION / 4 }
  }
};

export const CollapseDelete = React.forwardRef<
  HTMLDivElement,
  {
    children: React.ReactNode;
    title: React.ReactNode | string;
    onDelete?: () => void;
    initialOpen?: boolean;
    draggingProps?: DraggingProps;
    dataTestId?: string;
  }
>(({ children, title, onDelete, initialOpen = false, draggingProps, dataTestId }, ref) => {
  const [open, setOpen] = useState(initialOpen);

  const onToggleDropdown = useMemoizedFn(() => {
    setOpen((prev) => !prev);
  });

  return (
    <div
      className={cn('bg-background rounded border', 'flex w-full flex-col')}
      data-testid={dataTestId}>
      <CollapseDeleteHeader
        ref={ref}
        title={title}
        onToggleDropdown={onToggleDropdown}
        onClickDelete={onDelete}
        open={open}
        draggingProps={draggingProps}
      />

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className={cn('border-t', 'w-full overflow-hidden rounded-b')}
            {...dropdownAnimationConfig}>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

CollapseDelete.displayName = 'CollapseDelete';

const CollapseDeleteHeader = React.memo(
  React.forwardRef<
    HTMLDivElement,
    {
      title: React.ReactNode | string;
      onToggleDropdown: () => void;
      onClickDelete?: () => void;
      open: boolean;
      draggingProps?: DraggingProps;
    }
  >(({ title, onToggleDropdown, onClickDelete, open, draggingProps }, ref) => {
    const hasDraggingProps = !!draggingProps;
    const { isDragging, listeners, attributes, style } = draggingProps || {};

    return (
      <div
        ref={ref}
        onClick={onToggleDropdown}
        onKeyUp={() => {}}
        style={{ ...style }}
        className={cn(
          'h-8 max-h-8 min-h-8',
          'group flex cursor-pointer items-center justify-between space-x-1 select-none',
          isDragging && 'cursor-grabbing! shadow-lg'
        )}>
        <div
          {...listeners}
          {...attributes}
          className={cn(
            'flex h-full w-full items-center justify-start overflow-hidden pl-2.5',
            hasDraggingProps && 'cursor-grab'
          )}>
          <TitleComponent title={title} />
        </div>

        <DropdownIcon
          open={open}
          onToggleDropdown={onToggleDropdown}
          onClickDelete={onClickDelete}
          isDragging={isDragging}
        />
      </div>
    );
  })
);
CollapseDeleteHeader.displayName = 'CollapseDeleteHeader';

const TitleComponent: React.FC<{
  title: React.ReactNode | string;
}> = ({ title }) => {
  if (typeof title === 'string') {
    return (
      <Text variant="default" className="truncate">
        {title}
      </Text>
    );
  }

  return title;
};

const DropdownIcon: React.FC<{
  open: boolean;
  onToggleDropdown: () => void;
  onClickDelete?: () => void;
  isDragging?: boolean;
}> = React.memo(({ open, onToggleDropdown, onClickDelete, isDragging }) => {
  // const memoizedAnimation = useMemo(() => {
  //   return {
  //     initial: { rotate: 0 },
  //     animate: { rotate: open ? 90 : 0 },
  //     transition: { duration: ANIMATION_DURATION }
  //   };
  // }, [open]);

  const onClickToggleDropdown = useMemoizedFn((e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    onToggleDropdown();
  });

  const onClickDeletePreflight = useMemoizedFn((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onClickDelete?.();
  });

  const onClickContainer = useMemoizedFn(
    (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => {
      event.stopPropagation();
    }
  );

  return (
    <div
      className="relative flex h-full cursor-pointer items-center space-x-0.5 pr-1"
      onClick={onClickContainer}
      onKeyUp={(e) => e.key === 'Enter' && onClickContainer(e)}
      onKeyDown={(e) => e.key === 'Enter' && onClickContainer(e)}>
      {onClickDelete && (
        <Button
          size="small"
          onClick={onClickDeletePreflight}
          data-testid="delete-button"
          className={cn(
            'flex items-center justify-center',
            'opacity-0 duration-200',
            open ? 'opacity-100' : '',
            'group-hover:flex group-hover:opacity-90',
            'hover:text-black! hover:opacity-100',
            isDragging && 'hidden!'
          )}
          variant="ghost"
          prefix={<Trash />}
        />
      )}

      <Button
        size="small"
        className="flex"
        variant="ghost"
        data-testid="toggle-dropdown-button"
        onClick={onClickToggleDropdown}
        prefix={
          <div
            className={cn(
              'flex items-center justify-center transition-transform duration-200',
              isDragging && 'hidden!',
              open && 'rotate-90'
            )}>
            <ChevronRight />
          </div>
        }
      />
    </div>
  );
});
DropdownIcon.displayName = 'DropdownIcon';
