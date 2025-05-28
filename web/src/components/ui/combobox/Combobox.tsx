'use client';

import * as React from 'react';
import { Check } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { useHotkeys } from 'react-hotkeys-hook';
import { useMemoizedFn } from '@/hooks';
import { Text } from '@/components/ui/typography';

type BaseComboboxProps = {
  options: { value: string; label: string; icon?: React.ReactNode; secondaryLabel?: string }[];
  placeholder?: string;
  className?: string;
  itemClassName?: string;
  itemIconClassName?: string;
  emptyState?: string | React.ReactNode;
  useIndex?: boolean;
};

type SingleComboboxProps = BaseComboboxProps & {
  selectType?: 'single';
  value: string;
  onChange: (value: string) => void;
};

type MultipleComboboxProps = BaseComboboxProps & {
  selectType: 'multiple';
  value: string[];
  onChange: (values: string[]) => void;
};

type ComboboxProps = SingleComboboxProps | MultipleComboboxProps;

function isMultipleCombobox(props: ComboboxProps): props is MultipleComboboxProps {
  return props.selectType === 'multiple';
}

export function Combobox(props: ComboboxProps) {
  const {
    options,
    value,
    placeholder = 'Select an option...',
    className,
    itemClassName,
    itemIconClassName,
    emptyState,
    useIndex
  } = props;

  const isSelected = React.useCallback(
    (optionValue: string) => {
      if (isMultipleCombobox(props)) {
        return props.value.includes(optionValue);
      }
      return value === optionValue;
    },
    [props, value]
  );

  const handleSelect = useMemoizedFn((selectedValue: string) => {
    if (isMultipleCombobox(props)) {
      const currentValue = props.value;
      const newValue = currentValue.includes(selectedValue)
        ? currentValue.filter((v) => v !== selectedValue)
        : [...currentValue, selectedValue];
      props.onChange(newValue);
    } else {
      (props as SingleComboboxProps).onChange(selectedValue);
    }
  });

  const onCommandKeyDown = useMemoizedFn((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (useIndex) {
      const isKeyInIndex = e.key.match(/^\d+$/);
      if (isKeyInIndex) {
        const index = Number.parseInt(isKeyInIndex[0]);
        if (index < options.length) {
          e.preventDefault();
          handleSelect(options[index].value);
        }
      }
    }
  });

  return (
    <Command className={cn('rounded-lg border shadow-md', className)}>
      <CommandInput placeholder={placeholder} onKeyDown={onCommandKeyDown} />
      <CommandList>
        <CommandEmpty>{emptyState || 'No results found'}</CommandEmpty>
        <CommandGroup>
          {options.map((option, index) => {
            return (
              <ComboboxItem
                key={option.value}
                option={option}
                selected={isSelected(option.value)}
                handleSelect={handleSelect}
                itemClassName={itemClassName}
                itemIconClassName={itemIconClassName}
                useIndex={useIndex}
                index={index}
              />
            );
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

const ComboboxItem = ({
  option,
  selected,
  handleSelect,
  itemClassName,
  itemIconClassName,
  useIndex,
  index
}: {
  option: { value: string; label: string; icon?: React.ReactNode; secondaryLabel?: string };
  selected: boolean;
  handleSelect: (value: string) => void;
  itemClassName?: string;
  itemIconClassName?: string;
  useIndex?: boolean;
  index: number;
}) => {
  useHotkeys(index.toString(), () => handleSelect(option.value), {
    preventDefault: true,
    enabled: useIndex
  });

  return (
    <CommandItem
      key={option.value}
      value={option.value}
      onSelect={handleSelect}
      className={cn(
        'flex items-center',
        selected && 'bg-item-select hover:bg-item-select!',
        itemClassName
      )}>
      {option.icon && <span className={cn(itemIconClassName)}>{option.icon}</span>}
      <div className="flex flex-col space-y-0.5">
        <Text>{option.label}</Text>
        {option.secondaryLabel && (
          <Text size={'md'} variant={'secondary'}>
            {option.secondaryLabel}
          </Text>
        )}
      </div>
      <div className={cn('ml-auto flex space-x-1')}>
        <div className={cn('text-foreground', selected ? 'opacity-100' : 'opacity-0')}>
          <Check />
        </div>
        {useIndex && (
          <Text size={'sm'} variant={'secondary'} className="w-2 text-center">
            {index}
          </Text>
        )}
      </div>
    </CommandItem>
  );
};
