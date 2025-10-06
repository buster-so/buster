import { Command } from 'cmdk';
import { cn } from '@/lib/utils';
import type {
  SearchItem,
  SearchItemGroup,
  SearchItemSeperator,
  SearchItems,
  SearchModalContentProps,
} from './search-modal.types';

export const SearchModalContentItems = <M, T extends string>({
  searchItems,
  onSelect,
  onViewSearchItem,
}: Pick<SearchModalContentProps<M, T>, 'searchItems' | 'onSelect' | 'onViewSearchItem'>) => {
  return (
    <Command.List className="flex flex-col overflow-y-auto flex-1">
      {searchItems.map((item, index) => (
        <ItemsSelecter key={keyExtractor(item, index)} item={item} />
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

const ItemsSelecter = <M, T extends string>({ item }: { item: SearchItems<M, T> }) => {
  const type = item.type;
  if (type === 'item') {
    return <SearchItemComponent {...item} />;
  }

  if (type === 'group') {
    return <SearchItemGroupComponent item={item} />;
  }

  if (type === 'seperator') {
    return <SearchItemSeperatorComponent item={item} />;
  }

  const _exhaustiveCheck: never = type;

  return null;
};

const SearchItemComponent = <M, T extends string>({
  value,
  label,
  secondaryLabel,
  tertiaryLabel,
  icon,
  onSelect,
  loading,
  disabled,
}: SearchItem<M, T>) => {
  return (
    <Command.Item
      className={cn(
        'min-h-9 px-4 flex items-center',
        secondaryLabel && 'min-h-13.5',
        'data-[selected=true]:bg-item-hover data-[selected=true]:text-foreground',
        !disabled ? 'cursor-pointer' : 'cursor-not-allowed'
      )}
      value={value}
      disabled={disabled}
      onSelect={() => {
        onSelect?.();
      }}
    >
      {label}
    </Command.Item>
  );
};

const SearchItemGroupComponent = <M, T extends string>({
  item,
}: {
  item: SearchItemGroup<M, T>;
}) => {
  return (
    <Command.Group>
      {item.items.map((item, index) => (
        <ItemsSelecter key={keyExtractor(item, index)} item={item} />
      ))}
    </Command.Group>
  );
};

const SearchItemSeperatorComponent = ({ item }: { item: SearchItemSeperator }) => {
  return <Command.Separator className="border-t w-full" />;
};
