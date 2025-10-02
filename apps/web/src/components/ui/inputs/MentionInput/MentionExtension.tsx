import { Mention, type MentionNodeAttrs } from '@tiptap/extension-mention';
import { ReactNodeViewRenderer } from '@tiptap/react';
import type { SuggestionOptions } from '@tiptap/suggestion';
import type {
  MentionInputTriggerItem,
  MentionPopoverContentCallback,
  MentionStylePillProps,
  MentionSuggestionExtension,
} from './MentionInput.types';
import { MentionPill, type MentionPillAttributes } from './MentionPill';

export const MentionExtension = (suggestions: MentionSuggestionExtension[]) =>
  Mention.extend({
    addNodeView() {
      return ReactNodeViewRenderer(MentionPill, { as: 'span' });
    },
    addStorage() {
      return {
        pillStylingByTrigger: new Map<string, MentionStylePillProps>(), // trigger -> styling //will be set in the beforeCreate on the suggestion extension
        popoverByTrigger: new Map<string, MentionPopoverContentCallback>(), // trigger -> popover content //will be set in the beforeCreate on the suggestion extension
      };
    },
    addAttributes() {
      return {
        label: '',
        value: '',
        trigger: '',
        pillLabel: '',
        doNotAddPipeOnSelect: false,
      } satisfies MentionPillAttributes;
    },
    addCommands() {
      return {
        setPopoverByTrigger:
          (trigger: string, popoverContent: MentionPopoverContentCallback) => () => {
            this.editor.storage.mention.popoverByTrigger.set(trigger, popoverContent);
          },
        getPopoverByTrigger: (trigger) => () => {
          return this.editor.storage.mention.popoverByTrigger.get(trigger);
        },
        setPillStylingByTrigger:
          (trigger: string, pillStyling: { className?: string; style?: React.CSSProperties }) =>
          () => {
            this.editor.storage.mention.pillStylingByTrigger.set(trigger, pillStyling);
          },
        getPillStylingByTrigger: (trigger: string) => () => {
          return this.editor.storage.mention.pillStylingByTrigger.get(trigger);
        },
      };
    },
  }).configure({
    suggestions: suggestions as Omit<
      SuggestionOptions<MentionInputTriggerItem, MentionNodeAttrs>,
      'editor'
    >[],
    deleteTriggerWithBackspace: true,
  });
