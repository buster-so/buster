import type {
  GroupOverrideProps,
  MentionInputSuggestionsOnSelectParams,
  MentionInputSuggestionsProps,
} from './MentionInputSuggestions.types';
import { MentionInputSuggestionsGroup } from './MentionInputSuggestionsGroup';
import { MentionInputSuggestionsItem } from './MentionInputSuggestionsItem';
import { MentionInputSuggestionsSeparator } from './MentionInputSuggestionsSeparator';

export const MentionInputSuggestionsItemSelector = ({
  item,
  onSelect,
  addValueToInput,
  closeOnSelect,
  ...rest
}: {
  item: MentionInputSuggestionsProps['suggestionItems'][number];
  onSelect: (params: MentionInputSuggestionsOnSelectParams) => void;
} & GroupOverrideProps) => {
  if (item.type === 'separator') {
    return <MentionInputSuggestionsSeparator />;
  }

  if (item.type === 'group') {
    return <MentionInputSuggestionsGroup {...item} onSelect={onSelect} {...rest} />;
  }

  return (
    <MentionInputSuggestionsItem
      {...item}
      onSelect={onSelect}
      addValueToInput={item?.addValueToInput ?? addValueToInput}
      closeOnSelect={item?.closeOnSelect ?? closeOnSelect}
      {...rest}
    />
  );
};

export const MentionInputSuggestionsItemsSelector = ({
  suggestionItems,
  ...rest
}: {
  suggestionItems: MentionInputSuggestionsProps['suggestionItems'];
  onSelect: (params: MentionInputSuggestionsOnSelectParams) => void;
} & GroupOverrideProps) => {
  if (!suggestionItems) return null;
  return suggestionItems.map((item, index) => (
    <MentionInputSuggestionsItemSelector key={keySelector(item, index)} item={item} {...rest} />
  ));
};

const keySelector = (
  item: MentionInputSuggestionsProps['suggestionItems'][number],
  index: number
) => {
  if (item.type === 'separator') return `separator${index}`;
  if (item.type === 'group') return `${item.label}${index}`;
  return item.value;
};
