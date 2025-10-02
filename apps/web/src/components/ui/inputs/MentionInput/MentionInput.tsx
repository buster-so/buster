import { ClientOnly } from '@tanstack/react-router';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Placeholder from '@tiptap/extension-placeholder';
import Text from '@tiptap/extension-text';
import { EditorContent, EditorContext, useEditor } from '@tiptap/react';
import { cva } from 'class-variance-authority';
import { forwardRef, useImperativeHandle, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { MentionExtension } from './MentionExtension';
import type {
  MentionInputProps,
  MentionInputRef,
  MentionSuggestionExtension,
} from './MentionInput.types';
import type { MentionPillAttributes } from './MentionPill';
import { SubmitOnEnter } from './SubmitEnterExtension';
import { onUpdateTransformer } from './update-transformers';

const variants = cva('outline-0', {
  variants: {
    variant: {
      default: '',
      ghost: '',
    },
  },
});

export const MentionInput = forwardRef<MentionInputRef, MentionInputProps>(
  (
    {
      mentions,
      onChange,
      defaultValue = '',
      onFocus,
      onBlur,
      autoFocus,
      style,
      className,
      readOnly,
      disabled,
      onPressEnter,
      commandListNavigatedRef,
      placeholder = '',
      variant = 'default',
    },
    ref
  ) => {
    const classes = variants({ variant });
    const mentionsByTrigger = useMemo(() => {
      return mentions.reduce(
        (acc, mention) => {
          if (mention.char) {
            acc[mention.char] = mention;
          }
          return acc;
        },
        {} as Record<string, MentionSuggestionExtension>
      );
    }, [mentions]);

    const getValue = () => {
      return onUpdateTransformer({
        editor,
        mentionsByTrigger,
      });
    };

    const editor = useEditor({
      extensions: [
        Document,
        Paragraph,
        Text,
        Placeholder.configure({ placeholder }),
        MentionExtension(mentions),
        SubmitOnEnter({
          onPressEnter,
          mentionsByTrigger,
          commandListNavigatedRef,
        }),
      ],
      content: defaultValue,
      autofocus: autoFocus,
      editable: !disabled && !readOnly,
      editorProps: {
        attributes: {
          class: cn(classes, className),
        },
      },
      onUpdate: ({ editor }) => {
        onChange?.(
          onUpdateTransformer({
            editor,
            mentionsByTrigger,
          })
        );
      },
      onFocus: onFocus,
      onBlur: onBlur,
    });

    //exported for use in the mention input suggestions
    const addMentionToInput = (mention: MentionPillAttributes) => {
      editor
        .chain()
        .focus()
        .insertContent([
          { type: 'mention', attrs: mention },
          { type: 'text', text: ' ' }, // add a trailing space so the caret leaves the atom
        ])
        .run();
    };

    useImperativeHandle(
      ref,
      () => ({
        editor,
        getValue,
        addMentionToInput,
      }),
      [editor]
    );

    const providerValue = useMemo(() => ({ editor }), [editor]);

    return (
      <ClientOnly>
        <EditorContext.Provider value={providerValue}>
          <EditorContent
            className="outline-0 [&_p.is-editor-empty:first-child:before]:text-gray-light/80 [&_p.is-editor-empty:first-child:before]:content-[attr(data-placeholder)] [&_p.is-editor-empty:first-child:before]:float-left [&_p.is-editor-empty:first-child:before]:h-0 [&_p.is-editor-empty:first-child:before]:pointer-events-none"
            editor={editor}
            style={style}
          />
        </EditorContext.Provider>
      </ClientOnly>
    );
  }
);

MentionInput.displayName = 'MentionInput';
