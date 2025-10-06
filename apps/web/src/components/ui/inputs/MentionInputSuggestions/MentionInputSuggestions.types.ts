import type { Command } from 'cmdk';
import type React from 'react';
import type { MentionSuggestionExtension } from '../MentionInput';
import type {
  MentionInputProps,
  MentionInputRef,
  MentionTriggerItem,
} from '../MentionInput/MentionInput.types';

/**
 * @description Override the addValueToInput and closeOnSelect props for the item based on the group props
 */
export type GroupOverrideProps = {
  addValueToInput: boolean | undefined;
  closeOnSelect: boolean | undefined;
};

export type MentionInputSuggestionsDropdownItem<T = string> = {
  value: T;
  inputValue?: string; //this will be the value added to the input pill when addValueToInput is true
  label: string | React.ReactNode;
  icon?: React.ReactNode;
  popoverContent?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  closeOnSelect?: boolean; //defaults to parent
  type?: 'item';
  addValueToInput?: boolean; //defaults to group addValueToInput
  keywords?: string[];
};

export type MentionInputSuggestionsOnSelectParams = NonNullable<
  Pick<
    NonNullable<MentionInputSuggestionsDropdownItem>,
    | 'value'
    | 'label'
    | 'addValueToInput'
    | 'onClick'
    | 'closeOnSelect'
    | 'disabled'
    | 'loading'
    | 'keywords'
    | 'inputValue'
  >
>;

export type MentionInputSuggestionsDropdownGroup<T = string> = {
  label: string | React.ReactNode;
  suggestionItems: MentionInputSuggestionsDropdownItem<T>[];
  addValueToInput?: boolean;
  closeOnSelect?: boolean;
  type: 'group';
};

export type MentionInputSuggestionsSeparator = {
  type: 'separator';
};

export type MentionInputSuggestionsProps<T = string> = {
  defaultValue: string;
  value?: string;
  submitting?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  onChange?: MentionInputProps['onChange'];
  onPressEnter: MentionInputProps['onPressEnter'];
  autoFocus?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  emptyComponent?: React.ReactNode | string | false; //if false, no empty component will be shown
  children?: React.ReactNode;
  //mentions
  onMentionItemClick?: (params: MentionTriggerItem<T>) => void;
  mentions: MentionSuggestionExtension[];
  //suggestions
  suggestionItems: (
    | MentionInputSuggestionsDropdownItem<T>
    | MentionInputSuggestionsDropdownGroup<T>
    | MentionInputSuggestionsSeparator
  )[];
  onSuggestionItemClick?: (params: Omit<MentionInputSuggestionsOnSelectParams, 'onClick'>) => void;
  addSuggestionValueToInput?: boolean; //defaults to true
  closeSuggestionOnSelect?: boolean; //defaults to true
  className?: string;
  inputContainerClassName?: string;
  suggestionsContainerClassName?: string;
  inputClassName?: string;
  behavior?: 'default' | 'open-on-focus';
} & Pick<React.ComponentProps<typeof Command>, 'filter' | 'shouldFilter'>;

export type MentionInputSuggestionsRef = {
  value: string;
  onChangeValue: React.Dispatch<React.SetStateAction<string>>;
} & Pick<MentionInputRef, 'addMentionToInput' | 'getValue'>;

export type MentionInputSuggestionsContainerProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
} & Pick<MentionInputSuggestionsProps, 'submitting' | 'disabled' | 'onPressEnter'>;
