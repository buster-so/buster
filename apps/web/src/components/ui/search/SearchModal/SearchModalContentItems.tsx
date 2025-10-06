import { Command } from 'cmdk';
import { AnimatePresence, motion } from 'framer-motion';
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

export const SearchModalContentItems = <M, T extends string>({
  searchItems,
  onSelectGlobal,
}: Pick<SearchModalContentProps<M, T>, 'searchItems' | 'onViewSearchItem'> & CommonProps<M, T>) => {
  return (
    <Command.List className={cn('flex flex-col overflow-y-auto flex-1 px-3 pt-1.5 pb-1.5')}>
      {searchItems.map((item, index) => (
        <ItemsSelecter
          key={keyExtractor(item, index)}
          item={item}
          onSelectGlobal={onSelectGlobal}
        />
      ))}
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
  return (
    <Command.Item
      className={cn(
        'min-h-9 px-4 flex items-center rounded',
        secondaryLabel && 'min-h-13.5',
        'data-[selected=true]:bg-item-hover data-[selected=true]:text-foreground',
        !disabled ? 'cursor-pointer' : 'cursor-not-allowed',
        'space-x-2'
      )}
      value={value}
      disabled={disabled}
      onSelect={() => onSelectGlobal(item)}
    >
      {icon && (
        <span
          className={cn(
            'text-center group-hover:text-foreground size-4 text-icon-size text-icon-color',
            'data-[selected=true]:text-foreground',
            secondaryLabel && 'self-start mt-2.5'
          )}
        >
          {icon}
        </span>
      )}

      <div className="flex flex-col space-y-1">
        <Text>{label}</Text>
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
  return (
    <Command.Group>
      {item.items.map((item, index) => (
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
  return <Command.Separator className="border-t w-full" />;
};
