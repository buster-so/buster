/** biome-ignore-all lint/a11y/useFocusableInteractive: no ally stuff. I don't give a piss about nothin but the tide. */
/** biome-ignore-all lint/a11y/useAriaPropsForRole: blitz bama blitz */
/** biome-ignore-all lint/a11y/useSemanticElements: don't care about a11y for this one **/
import { Command, useCommandState } from 'cmdk';
import { AnimatePresence, motion } from 'framer-motion';
import { useRef } from 'react';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import type {
  SearchItem,
  SearchItemGroup,
  SearchItemSeperator,
  SearchItems,
  SearchModalContentProps,
} from './search-modal.types';

type CommonProps<M, T extends string> = {
  onSelectGlobal: (d: SearchItem<M, T>) => void;
};

const SCROLL_THRESHOLD = 55;

export const SearchModalContentItems = <M, T extends string>({
  searchItems,
  loading,
  onSelectGlobal,
  scrollContainerRef,
}: Pick<
  SearchModalContentProps<M, T>,
  'scrollContainerRef' | 'loading' | 'searchItems' | 'onViewSearchItem'
> &
  CommonProps<M, T>) => {
  const hasFiredRef = useRef(false);

  return (
    <Command.List
      className={cn(
        'flex flex-col overflow-y-auto flex-1 px-3 pt-1.5 pb-1.5',
        '[&_[hidden]+[data-separator-after-hidden]]:hidden'
      )}
      ref={scrollContainerRef}
    >
      {searchItems.map((item, index) => (
        <ItemsSelecter
          key={keyExtractor(item, index)}
          item={item}
          onSelectGlobal={onSelectGlobal}
        />
      ))}

      {loading && (
        <div className="flex items-center justify-center my-1.5">
          <Text size={'sm'} variant={'secondary'}>
            Loading...
          </Text>
        </div>
      )}
    </Command.List>
  );
};

const keyExtractor = <M, T extends string>(item: SearchItems<M, T>, index: number): string => {
  if (item.type === 'item') {
    return String(item.value);
  }
  return item.type + index;
};

const ItemsSelecter = <M, T extends string>({
  item,
  onSelectGlobal,
}: {
  item: SearchItems<M, T>;
  onSelectGlobal: (d: SearchItem<M, T>) => void;
}) => {
  const type = item.type;
  if (type === 'item') {
    return <SearchItemComponent {...item} onSelectGlobal={onSelectGlobal} />;
  }

  if (type === 'group') {
    return <SearchItemGroupComponent item={item} onSelectGlobal={onSelectGlobal} />;
  }

  if (type === 'seperator') {
    return <SearchItemSeperatorComponent item={item} />;
  }

  const _exhaustiveCheck: never = type;

  return null;
};

const SearchItemComponent = <M, T extends string>(item: SearchItem<M, T> & CommonProps<M, T>) => {
  const { value, label, secondaryLabel, tertiaryLabel, icon, disabled, onSelectGlobal } = item;
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <Command.Item
      className={cn(
        'min-h-9 pl-4 pr-4 flex items-center rounded',
        secondaryLabel && 'min-h-13.5',
        'data-[selected=true]:bg-item-hover data-[selected=true]:text-foreground',
        !disabled ? 'cursor-pointer' : 'cursor-not-allowed',
        'space-x-2 overflow-hidden @container'
      )}
      value={value}
      disabled={disabled}
      onSelect={() => onSelectGlobal(item)}
    >
      {icon && (
        <span
          className={cn(
            'text-center group-hover:text-foreground size-4 text-icon-color',
            'data-[selected=true]:text-foreground',
            secondaryLabel && 'self-start mt-2.5'
          )}
          style={{ fontSize: 16 }}
        >
          {icon}
        </span>
      )}

      <div ref={containerRef} className="flex flex-col space-y-1 w-full overflow-hidden">
        <div className="flex space-x-1.5 w-full justify-between items-center">
          <Text truncate>{label}</Text>
          <AnimatePresence initial={false}>
            {tertiaryLabel && (
              <Text
                size="sm"
                variant="secondary"
                className="whitespace-nowrap @[600px]:block! hidden"
              >
                {tertiaryLabel}
              </Text>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence initial={false}>
          {secondaryLabel && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0 } }}
              transition={{ duration: 0.2 }}
            >
              <Text size="sm" variant="secondary">
                {secondaryLabel}
              </Text>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Command.Item>
  );
};

const SearchItemGroupComponent = <M, T extends string>({
  item,
  onSelectGlobal,
}: {
  item: SearchItemGroup<M, T>;
  onSelectGlobal: (d: SearchItem<M, T>) => void;
}) => {
  const { className, items, label } = item;
  return (
    <Command.Group
      data-testid="search-item-group"
      className={cn(
        'text-text-tertiary overflow-hidden [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2.5 [&_[cmdk-group-heading]]:text-sm [&_[cmdk-group-heading]]:font-base',
        className
      )}
      heading={label}
    >
      {items.map((item, index) => (
        <ItemsSelecter
          key={keyExtractor(item, index)}
          item={item}
          onSelectGlobal={onSelectGlobal}
        />
      ))}
    </Command.Group>
  );
};

const SearchItemSeperatorComponent = ({ item: _item }: { item: SearchItemSeperator }) => {
  const hasResults = useCommandState((x) => x.filtered.count) > 0;

  return (
    <div
      role="separator"
      className={cn(
        'bg-border my-1.5 h-[0.5px]',
        'first:hidden',
        'last:hidden',
        'has-[+[role="separator"]]:hidden',
        'has-[+[hidden]]:hidden',
        !hasResults && 'hidden'
      )}
      data-separator-after-hidden="true"
    />
  );
};
