import { Command } from 'cmdk';
import type React from 'react';
import { cn } from '@/lib/utils';
import { Popover } from '../../popover';
import type {
  MentionInputSuggestionsDropdownItem,
  MentionInputSuggestionsOnSelectParams,
} from './MentionInputSuggestions.types';

export type MentionInputSuggestionsItemProps = {
  onSelect: (d: MentionInputSuggestionsOnSelectParams) => void;
} & MentionInputSuggestionsDropdownItem & {
    className?: string;
    style?: React.CSSProperties;
  };

export const MentionInputSuggestionsItem = ({
  value,
  inputValue,
  label,
  icon,
  onClick,
  disabled,
  loading,
  closeOnSelect,
  type,
  addValueToInput,
  onSelect,
  className,
  style,
  popoverContent,
}: MentionInputSuggestionsItemProps) => {
  const onSelectItem = () => {
    onSelect({
      value,
      inputValue,
      label,
      onClick,
      addValueToInput,
      closeOnSelect,
      disabled,
      loading,
    });
  };

  return (
    <PopoverContentWrapper popoverContent={popoverContent}>
      <Command.Item
        className={cn(
          'data-[selected=true]:bg-item-hover data-[selected=true]:text-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-base outline-none select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
          !disabled ? 'cursor-pointer' : 'cursor-not-allowed',
          'text-secondary group min-h-9',
          className
        )}
        value={value}
        data-testid={`type-${type}-value-${value}`}
        style={style}
        onMouseDown={() => {
          onSelectItem();
        }}
        onSelect={() => {
          onSelectItem();
        }}
      >
        {icon && (
          <span className="text-icon-color text-center group-hover:text-foreground text-icon-size-sm size-3">
            {icon}
          </span>
        )}
        {label}
      </Command.Item>
    </PopoverContentWrapper>
  );
};

const PopoverContentWrapper = ({
  children,
  popoverContent,
}: {
  children: React.ReactNode;
  popoverContent?: MentionInputSuggestionsItemProps['popoverContent'];
}) => {
  if (!popoverContent) return children;

  return (
    <Popover
      trigger="hover"
      side="top"
      sideOffset={10}
      align="start"
      className="p-0"
      content={popoverContent}
      delayDuration={600}
    >
      {children}
    </Popover>
  );
};
