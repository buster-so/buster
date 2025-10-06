import type { AnyPluginConfig, Value } from 'platejs';
import { Plate, type TPlateEditor } from 'platejs/react';
import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ScrollToBottomButton } from '@/components/features/buttons/ScrollToBottomButton';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { useDebounceFn } from '@/hooks/useDebounce';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { cn } from '@/lib/utils';
import { Editor } from './Editor';
import { EditorContainer } from './EditorContainer';
import { platejsToMarkdown } from './plugins/markdown-kit/platejs-conversions';
import { ThemeWrapper } from './ThemeWrapper/ThemeWrapper';
import { useReportEditor } from './useReportEditor';
export interface ReportEditorProps {
  // We accept the generic Value type but recommend using ReportTypes.Value for type safety
  value?: string; //markdown
  initialElements?: Value;
  placeholder?: string;
  readOnly?: boolean;
  isStreaming?: boolean; //if true, the editor will be updated with the value prop when it is changed, everything will be readonly
  variant?: 'default';
  className?: string;
  containerClassName?: string;
  style?: React.CSSProperties;
  onValueChange?: (value: string) => void; //markdown
  useFixedToolbarKit?: boolean;
  onReady?: (editor: IReportEditor) => void;
  id?: string;
  mode?: 'export' | 'default';
  preEditorChildren?: React.ReactNode;
  postEditorChildren?: React.ReactNode;
  scrollAreaRef?: React.RefObject<HTMLDivElement | null>; //used for the scroll areas
}

export type IReportEditor = TPlateEditor<Value, AnyPluginConfig>;

export interface AppReportRef {
  editor: TPlateEditor<Value, AnyPluginConfig> | null;
  onReset: () => void;
}

// AppReport is a functional component wrapped in forwardRef to allow parent components to access the underlying editor instance if needed.
export const ReportEditor = React.memo(
  React.forwardRef<AppReportRef, ReportEditorProps>(
    (
      {
        value,
        placeholder,
        initialElements,
        id,
        onValueChange,
        onReady,
        variant = 'default',
        className,
        containerClassName,
        style,
        mode = 'default',
        useFixedToolbarKit = false,
        readOnly = false,
        isStreaming = false,
        preEditorChildren,
        postEditorChildren,
        scrollAreaRef,
      },
      ref
    ) => {
      // Initialize the editor instance using the custom useEditor hook
      const isReady = useRef(false);

      const { isAutoScrollEnabled, enableAutoScroll, disableAutoScroll, scrollToBottom } =
        useAutoScroll(scrollAreaRef, {
          enabled: isStreaming,
          bottomThreshold: 50,
          observeSubTree: true,
        });

      const editor = useReportEditor({
        isStreaming,
        mode,
        readOnly,
        value,
        initialElements,
        useFixedToolbarKit,
        scrollAreaRef,
      });

      const onReset = useMemoizedFn(() => {
        if (!editor) {
          console.warn('Editor not yet initialized');
          return;
        }
        if (readOnly) {
          console.warn('Editor is read only');
          return;
        }
        editor.tf.reset();
      });

      // Optionally expose the editor instance to the parent via ref
      useImperativeHandle(ref, () => ({ editor, onReset }), [editor, { editor, onReset }]);

      const onValueChangePreflight = ({
        value,
        editor,
      }: {
        value: Value;
        editor: TPlateEditor<Value, AnyPluginConfig>;
      }) => {
        if (isReady.current && !readOnly && onValueChange && !isStreaming) {
          platejsToMarkdown(editor, value)
            .then((markdown) => {
              onValueChange(markdown);
            })
            .catch((error) => {
              console.error('Error converting platejs to markdown', error);
            });
        }

        if (!isReady.current) {
          onReady?.(editor);
          isReady.current = true;
        }
      };

      const { run: onValueChangeDebounced } = useDebounceFn(onValueChangePreflight, {
        wait: 1500,
      });

      useEffect(() => {
        if (isStreaming) {
          enableAutoScroll();
        } else {
          disableAutoScroll();
        }
      }, [isStreaming]);

      if (!editor) return null;

      return (
        <Plate editor={editor} onValueChange={onValueChangeDebounced}>
          <EditorContainer
            variant={variant}
            className={cn('editor-container relative', containerClassName)}
          >
            {preEditorChildren}
            <ThemeWrapper id={id}>
              <Editor
                style={style}
                placeholder={placeholder}
                className={cn('editor', className)}
                readOnly={readOnly} //do not have streaming here, it causes scrolling issue when toggling
                autoFocus
              />
            </ThemeWrapper>
            {postEditorChildren}
            {isStreaming && (
              <ScrollToBottomButton
                isAutoScrollEnabled={isAutoScrollEnabled}
                scrollToBottom={scrollToBottom}
                className="fixed right-8 bottom-8 z-10"
              />
            )}
          </EditorContainer>
        </Plate>
      );
    }
  )
);

ReportEditor.displayName = 'ReportEditor';
