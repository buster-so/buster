import { type Editor, posToDOMRect, ReactRenderer } from '@tiptap/react';
import { defaultQueryMentionsFilter } from './defaultQueryMentionsFilter';
import type {
  MentionInputTriggerItem,
  MentionPopoverContentCallback,
  MentionStylePillProps,
  MentionSuggestionExtension,
} from './MentionInput.types';
import {
  MentionList,
  type MentionListImperativeHandle,
  type MentionListProps,
} from './MentionList/MentionList';

export const createMentionSuggestionExtension = ({
  trigger,
  items,
  popoverContent,
  onChangeTransform,
  pillStyling,
  popoverClassName,
}: {
  trigger: string;
  items:
    | React.RefObject<MentionInputTriggerItem[]>
    | ((props: {
        query: string;
        defaultQueryMentionsFilter: typeof defaultQueryMentionsFilter;
        editor: Editor;
      }) => MentionInputTriggerItem[]); //if no function is provided we will use a literal string match
  popoverContent?: MentionPopoverContentCallback;
  pillStyling?: MentionStylePillProps;
  popoverClassName?: string;
  onChangeTransform?: MentionSuggestionExtension['onChangeTransform'];
}): MentionSuggestionExtension => ({
  char: trigger,
  items:
    //beware of stale closures here. We should use a ref to get the latest items
    typeof items === 'function'
      ? (props) => {
          return items({ ...props, defaultQueryMentionsFilter });
        }
      : ({ query }) => defaultQueryMentionsFilter(query, items.current),
  render: () => {
    let component: ReactRenderer<MentionListImperativeHandle, MentionListProps<string>>;

    return {
      onBeforeStart: ({ editor }) => {
        if (popoverContent && editor.commands.setPopoverByTrigger)
          editor.commands.setPopoverByTrigger(trigger, popoverContent);
        if (pillStyling && editor.commands.setPillStylingByTrigger)
          editor.commands.setPillStylingByTrigger(trigger, pillStyling);
      },
      onStart: (props) => {
        const { editor } = props;
        component = new ReactRenderer(
          MentionList as React.ComponentType<MentionListProps<string>>,
          { props: { ...props, trigger, className: popoverClassName }, editor: props.editor }
        );

        if (!props.clientRect) {
          console.warn('No client rect for mention suggestion');
          return;
        }
        const rect = posToDOMRect(
          editor.view,
          editor.state.selection.from,
          editor.state.selection.to
        );
        const element = component.element as HTMLElement;
        element.style.position = 'absolute';
        element.style.left = `${rect.left}px`;
        element.style.top = `${rect.top}px`;
        element.style.transform = `translateY(1.15lh)`;
        element.classList.add('z-50');
        element.classList.add('shadow');

        document.body.appendChild(component.element);
      },

      onUpdate(props) {
        component.updateProps(props);
        //DO I need to make an update position here?
        //  updatePosition(props.editor, component.element);
      },

      onKeyDown(props) {
        if (props.event.key === 'Escape') {
          component.destroy();
          return true;
        }

        return component.ref?.onKeyDown(props) ?? false;
      },

      onExit() {
        component.element.remove();
        component.destroy();
      },
    };
  },
  command: ({ editor, props, range }) => {
    const doNotAddPipeOnSelect = props.doNotAddPipeOnSelect ?? false;
    if (doNotAddPipeOnSelect) {
      // Remove the trigger node/text that was typed to trigger the mention
      editor.chain().focus().deleteRange(range).run();
      return;
    }
    editor
      .chain()
      .focus()
      .insertContentAt(range, [
        { type: 'mention', attrs: props },
        { type: 'text', text: ' ' }, // add a trailing space so the caret leaves the atom
      ])
      .run();
  },
  onChangeTransform,
});
