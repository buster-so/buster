import { Extension } from '@tiptap/core';
import type { MentionInputProps, MentionSuggestionExtension } from './MentionInput.types';
import { onUpdateTransformer } from './update-transformers';

export const SubmitOnEnter = ({
  onPressEnter,
  mentionsByTrigger,
  commandListNavigatedRef,
}: {
  onPressEnter?: MentionInputProps['onPressEnter'];
  mentionsByTrigger: Record<string, MentionSuggestionExtension>;
  commandListNavigatedRef?: React.RefObject<boolean>;
}) =>
  Extension.create({
    addKeyboardShortcuts() {
      return {
        Enter: ({ editor }) => {
          // If command list has been navigated, don't handle here - let the parent handle it
          if (commandListNavigatedRef?.current) {
            return !!onPressEnter;
          }

          // Otherwise, handle the Enter key press
          if (onPressEnter) {
            onPressEnter?.(
              onUpdateTransformer({
                editor,
                mentionsByTrigger,
              })
            );
          }
          return !!onPressEnter;
        },
        'Shift-Enter': ({ editor }) => {
          editor.commands.splitBlock();
          return true;
        }, // or insert a break
      };
    },
  });
