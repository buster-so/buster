import type { MentionTriggerItem } from '../MentionInput';
import type {
  MentionInputSuggestionsDropdownGroup,
  MentionInputSuggestionsDropdownItem,
} from './MentionInputSuggestions.types';

export const createInputItem = <T = string>() => {
  return (item: MentionInputSuggestionsDropdownItem<T>) => item;
};

export const createInputItems = <T = string>() => {
  return (items: MentionInputSuggestionsDropdownItem<T>[]) => items;
};

export const createInputGroup = <T = string>() => {
  return (group: MentionInputSuggestionsDropdownGroup<T>) => group;
};

export const createInputGroups = <T = string>() => {
  return (groups: MentionInputSuggestionsDropdownGroup<T>[]) => groups;
};

export const createInputMention = <T = string>() => {
  return (mention: MentionTriggerItem<T>) => mention;
};

export const createInputMentions = <T = string>() => {
  return (mentions: MentionTriggerItem<T>[]) => mentions;
};
