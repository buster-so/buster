import type { MentionNodeAttrs, MentionOptions } from '@tiptap/extension-mention';
import type { Editor, EditorEvents } from '@tiptap/react';
import type { MentionPillAttributes } from './MentionPill';

export type MentionOnSelectParams<T = unknown> = {
  value: T;
  loading?: boolean;
  disabled?: boolean;
  selected?: boolean;
};

export type MentionPopoverContentCallback = (
  props: Pick<MentionTriggerItem, 'value'>
) => React.ReactNode;

export type MentionPopoverStorageMap = Map<string, MentionPopoverContentCallback>;

export type MentionStylePillStorageMap = Map<string, MentionStylePillProps>;

type MentionTriggerItemBase<T = string> = {
  value: T;
  label: string | React.ReactNode; //must be all spans, is pillLabel if provided this is ignored in the pill
  pillLabel?: string | React.ReactNode; //must be all spans
  labelMatches?: string[]; //if this is provided, we will use it to filter the items
  icon?: React.ReactNode;
  onSelect?: (d: MentionOnSelectParams) => void;
  disabled?: boolean; //will inherit from if undefined
  loading?: boolean;
  type?: 'item';
  selected?: boolean;
  doNotAddPipeOnSelect?: boolean;
  secondaryContent?: React.ReactNode;
};

type MentionTriggerItemNotPiped<T = string> = MentionTriggerItemBase<T> & {
  doNotAddPipeOnSelect: true;
};

export type MentionTriggerItem<T = string> =
  | MentionTriggerItemBase<T>
  | MentionTriggerItemNotPiped<T>;

export type MentionInputTriggerGroup<T = string> = {
  items: MentionTriggerItem<T>[];
  label?: string | React.ReactNode | null;
  icon?: React.ReactNode;
  type: 'group';
  disabled?: boolean;
  className?: string;
};

export type MentionInputTriggerSeparator = {
  type: 'separator';
};

export type MentionInputTriggerItem<T = string> =
  | MentionTriggerItem<T>
  | MentionInputTriggerGroup<T>
  | MentionInputTriggerSeparator;

export type MentionStylePillProps = {
  className?: string | ((props: MentionPillAttributes) => string);
  style?: React.CSSProperties | ((props: MentionPillAttributes) => React.CSSProperties);
};

//The tip tap type for a suggestion

export type MentionSuggestionExtension<T = string> = MentionOptions<
  MentionInputTriggerItem<T>,
  MentionPillAttributes & MentionNodeAttrs
>['suggestion'] & {
  onChangeTransform?: (v: MentionPillAttributes) => string;
};

export type MentionArrayItem =
  | {
      type: 'text';
      text: string;
    }
  | {
      type: 'mention';
      attrs: MentionPillAttributes;
    };

export type MentionOnChange = {
  transformedValue: string;
  arrayValue: MentionArrayItem[];
  editorText: string;
};

export type GetMentionOnChange = () => MentionOnChange;

export type MentionOnChangeFn = (d: {
  transformedValue: string;
  arrayValue: MentionArrayItem[];
  editorText: string;
}) => void;

export type MentionInputProps = {
  mentions: MentionSuggestionExtension[];
  onChange: MentionOnChangeFn;
  onPressEnter?: MentionOnChangeFn;
  onFocus?: (v: EditorEvents['focus']) => void;
  onBlur?: (v: EditorEvents['blur']) => void;
  defaultValue?: string;
  autoFocus?: boolean;
  style?: React.CSSProperties;
  className?: string;
  readOnly?: boolean;
  disabled?: boolean;
  commandListNavigatedRef?: React.RefObject<boolean>;
  variant?: 'default' | 'ghost';
  placeholder?: string;
};

export type MentionInputRef = {
  editor: Editor | null;
  addMentionToInput: (mention: MentionPillAttributes) => void;
  getValue: GetMentionOnChange;
};

declare module '@tiptap/core' {
  interface Storage {
    mention: {
      popoverByTrigger: MentionPopoverStorageMap;
      pillStylingByTrigger: MentionStylePillStorageMap;
    };
  }
  interface Commands {
    mention: {
      setPopoverByTrigger: (trigger: string, popoverContent: MentionPopoverContentCallback) => void;
      getPopoverByTrigger: (trigger: string) => MentionPopoverContentCallback | undefined;
      setPillStylingByTrigger: (trigger: string, pillStyling: MentionStylePillProps) => void;
      getPillStylingByTrigger: (trigger: string) => MentionStylePillProps | undefined;
    };
  }
}
