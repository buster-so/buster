/** biome-ignore-all lint/a11y/useFocusableInteractive: no ally stuff. I don't give a piss about nothin but the tide. */
/** biome-ignore-all lint/a11y/useAriaPropsForRole: blitz bama blitz */
/** biome-ignore-all lint/a11y/useSemanticElements: don't care about a11y for this one **/
import { Command, useCommandState } from 'cmdk';
import { AnimatePresence, motion } from 'framer-motion';
import { useRef } from 'react';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import { Checkbox } from '../../checkbox';
import type {
  SearchItem,
  SearchItemGroup,
  SearchItemSeperator,
  SearchItems,
  SearchModalContentProps,
  SearchMode,
} from './search-modal.types';

type CommonProps<M, T extends string> = {
  onSelectGlobal: (d: SearchItem<M, T>) => void;
};

export const SearchModalContentItems = <M, T extends string>({
  searchItems,
  loading,
  onSelectGlobal,
  scrollContainerRef,
  showBottomLoading,
  mode,
  selectedItems,
}: Pick<
  SearchModalContentProps<M, T>,
  'scrollContainerRef' | 'loading' | 'searchItems' | 'showBottomLoading' | 'mode' | 'selectedItems'
> &
  CommonProps<M, T>) => {
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
          mode={mode}
        />
      ))}

      {showBottomLoading && loading && (
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
  mode,
}: {
  item: SearchItems<M, T>;
  onSelectGlobal: (d: SearchItem<M, T>) => void;
  mode: SearchMode;
  selected: boolean | undefined;
}) => {
  const type = item.type;
  if (type === 'item') {
    return <SearchItemComponent {...item} onSelectGlobal={onSelectGlobal} mode={mode} />;
  }

  if (type === 'group') {
    return <SearchItemGroupComponent item={item} onSelectGlobal={onSelectGlobal} mode={mode} />;
  }

  if (type === 'seperator') {
    return <SearchItemSeperatorComponent item={item} />;
  }

  const _exhaustiveCheck: never = type;

  return null;
};

const SearchItemComponent = <M, T extends string>(
  item: SearchItem<M, T> & CommonProps<M, T> & { mode: SearchMode; selected: boolean | undefined }
) => {
  const {
    value,
    selected = false,
    label,
    secondaryLabel,
    tertiaryLabel,
    icon,
    disabled,
    onSelectGlobal,
    mode,
  } = item;
  const containerRef = useRef<HTMLDivElement>(null);
  const isSelectMode = mode === 'select-single' || mode === 'select-multiple';

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
      {isSelectMode && (
        <div>
          <Checkbox checked={selected} onCheckedChange={() => onSelectGlobal(item)} />
        </div>
      )}

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
  mode,
}: {
  item: SearchItemGroup<M, T>;
  onSelectGlobal: (d: SearchItem<M, T>) => void;
  mode: SearchMode;
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
          mode={mode}
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
