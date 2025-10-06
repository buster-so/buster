import type {
  MentionInputTriggerGroup,
  MentionInputTriggerItem,
  MentionTriggerItem,
} from '../MentionInput.types';
import { MentionListGroup } from './MentionListGroup';
import { MentionListItem } from './MentionListItem';
import { MentionListSeperator } from './MentionListSeperator';

type ExtendedOptions<T = string> = {
  selectedItem: T | undefined;
  setSelectedItem: (item: T | undefined) => void;
  onSelectItem: (item: T) => void;
};

export type MentionInputTriggerItemExtended<T = string> = MentionInputTriggerItem<T> &
  ExtendedOptions<T>;

export type MentionListGroupExtended<T = string> = MentionInputTriggerGroup<T> & ExtendedOptions<T>;

export type MentionTriggerItemExtended<T = string> = Omit<MentionTriggerItem<T>, 'onSelect'> &
  ExtendedOptions<T> & {
    isSelected: boolean;
  };

export function MentionListSelector<T = string>(props: MentionInputTriggerItemExtended<T>) {
  const { type } = props;

  if (type === 'group') {
    return <MentionListGroup {...props} />;
  }

  if (type === 'separator') {
    return <MentionListSeperator {...props} />;
  }

  if (type === 'item' || !type) {
    const isSelected = props.selectedItem === props.value;
    return <MentionListItem {...props} isSelected={isSelected} />;
  }

  const _exhaustiveCheck: never = type;
  console.warn('mention list selector type not found', _exhaustiveCheck);

  return null;
}
