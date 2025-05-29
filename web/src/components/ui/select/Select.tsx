import { useMemoizedFn } from '@/hooks';
import type React from 'react';
import {
  Select as SelectBase,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from './SelectBase';

interface SelectItemGroup<T = string> {
  label: string;
  items: SelectItem<T>[];
}

export interface SelectItem<T = string> {
  value: T;
  label: string | React.ReactNode; //this will be used in the select item text
  secondaryLabel?: string;
  icon?: React.ReactNode;
  searchLabel?: string; // Used for filtering
  disabled?: boolean;
}

export interface SelectProps<T> {
  items: SelectItem<T>[] | SelectItemGroup[];
  disabled?: boolean;
  onChange: (value: T) => void;
  placeholder?: string;
  value?: string | undefined;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  showIndex?: boolean;
  className?: string;
  defaultValue?: string;
  dataTestId?: string;
}

export const Select = <T extends string>({
  items,
  showIndex,
  disabled,
  onChange,
  placeholder,
  value,
  onOpenChange,
  open,
  className = '',
  defaultValue,
  dataTestId
}: SelectProps<T>) => {
  const onValueChange = useMemoizedFn((value: string) => {
    onChange(value as T);
  });
  return (
    <SelectBase
      disabled={disabled}
      onOpenChange={onOpenChange}
      open={open}
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}>
      <SelectTrigger className={className} data-testid={dataTestId}>
        <SelectValue placeholder={placeholder} defaultValue={value || defaultValue} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item, index) => (
          <SelectItemSelector key={index} item={item} index={index} showIndex={showIndex} />
        ))}
      </SelectContent>
    </SelectBase>
  );
};
Select.displayName = 'Select';

const SelectItemSelector = <T,>({
  item,
  index,
  showIndex
}: {
  item: SelectItem<T> | SelectItemGroup;
  index: number;
  showIndex?: boolean;
}) => {
  const isGroup = typeof item === 'object' && 'items' in item;

  if (isGroup) {
    const _item = item as SelectItemGroup;
    return (
      <SelectGroup>
        <SelectLabel>{_item.label}</SelectLabel>
        {_item.items?.map((item) => (
          <SelectItemSelector key={item.value} item={item} index={index} showIndex={showIndex} />
        ))}
      </SelectGroup>
    );
  }

  const { value, label, icon, secondaryLabel, disabled, ...rest } = item as SelectItem;

  return (
    <SelectItem
      disabled={disabled}
      value={value}
      icon={icon}
      index={showIndex ? index : undefined}
      secondaryChildren={
        secondaryLabel && <SelectItemSecondaryText>{secondaryLabel}</SelectItemSecondaryText>
      }>
      {label}
    </SelectItem>
  );
};

SelectItemSelector.displayName = 'SelectItemSelector';
const SelectItemSecondaryText: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <span className="text-gray-light text2xs">{children}</span>;
};
