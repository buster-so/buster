import { Command } from 'cmdk';
import type React from 'react';
import { cn } from '@/lib/utils';
import type {
  MentionInputSuggestionsDropdownGroup,
  MentionInputSuggestionsOnSelectParams,
} from './MentionInputSuggestions.types';
import { MentionInputSuggestionsItemsSelector } from './MentionInputSuggestionsItemSelector';

export type MentionInputSuggestionsGroupProps = MentionInputSuggestionsDropdownGroup & {
  onSelect: (params: MentionInputSuggestionsOnSelectParams) => void;
} & {
  className?: string;
  style?: React.CSSProperties;
};

export const MentionInputSuggestionsGroup = ({
  suggestionItems,
  label,
  onSelect,
  addValueToInput,
  className,
  closeOnSelect,
  style,
  ...rest
}: MentionInputSuggestionsGroupProps) => {
  return (
    <Command.Group
      className={cn(
        'text-text-tertiary overflow-hidden [&_[cmdk-group-heading]]:px-0 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-sm [&_[cmdk-group-heading]]:font-base [&_[cmdk-group-heading]]:h-8',
        className
      )}
      style={style}
      heading={label}
    >
      <MentionInputSuggestionsItemsSelector
        suggestionItems={suggestionItems}
        onSelect={onSelect}
        addValueToInput={addValueToInput}
        closeOnSelect={closeOnSelect}
        {...rest}
      />
    </Command.Group>
  );
};
