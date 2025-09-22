import type { Value } from 'platejs';
import { type TPlateEditor, useEditorRef, usePlateEditor } from 'platejs/react';
import { useEffect, useMemo, useRef } from 'react';
import { useThrottleFn } from '@/hooks/useThrottleFn';
import { EditorKit } from './editor-kit';
import { FIXED_TOOLBAR_KIT_KEY } from './plugins/fixed-toolbar-kit';
import { GlobalVariablePlugin } from './plugins/global-variable-kit';
import { markdownToPlatejs } from './plugins/markdown-kit/platejs-conversions';
import { StreamContentPlugin } from './plugins/stream-content-plugin';

export const useReportEditor = ({
  value,
  isStreaming,
  mode = 'default',
  readOnly,
  useFixedToolbarKit = false,
  initialElements,
  scrollAreaRef,
}: {
  value: string | undefined; //markdown
  initialElements?: Value;
  readOnly: boolean | undefined;
  useFixedToolbarKit?: boolean;
  isStreaming: boolean;
  mode?: 'export' | 'default';
  scrollAreaRef?: React.RefObject<HTMLDivElement | null>;
}) => {
  const plugins = useMemo(() => {
    const filteredKeys: string[] = [];
    if (!useFixedToolbarKit) {
      filteredKeys.push(FIXED_TOOLBAR_KIT_KEY);
    }

    return EditorKit({ scrollAreaRef, mode }).filter((p) => !filteredKeys.includes(p.key));
  }, []);

  const editor = usePlateEditor({
    plugins,
    value: initialElements,
    readOnly: readOnly, //this is for the initial value
  });

  useEditorServerUpdates({ editor, value, isStreaming });

  return editor;
};

export type ReportEditor = TPlateEditor<Value, ReturnType<typeof EditorKit>[number]>;

export const useEditor = () => useEditorRef<ReportEditor>();

const isEmptyEditor = (editor: ReportEditor) => {
  if (editor.children.length === 0) return true;
  if (editor.children.length === 1) {
    const hasContent = editor.children[0].children.some((v) => v.text);
    return !hasContent;
  }
  return false;
};

const numberOfUpdatesPerSecond = 1000 / 24;
const useEditorServerUpdates = ({
  editor,
  value = '',
  isStreaming,
}: {
  editor: ReportEditor;
  value: string | undefined;
  isStreaming: boolean;
}) => {
  const hasInitialized = useRef(false);

  const { run: throttleStreamUpdate } = useThrottleFn(
    (v: string) => {
      const streamContentPlugin = editor.getPlugin(StreamContentPlugin);

      streamContentPlugin.api.streamContent.start();
      markdownToPlatejs(editor, v).then((elements) => {
        streamContentPlugin.api.streamContent.streamFull(elements);
      });
    },
    { wait: numberOfUpdatesPerSecond, leading: true }
  );

  useEffect(() => {
    if (editor && isStreaming) {
      hasInitialized.current = true;
      throttleStreamUpdate(value);
    } else if (editor && value && !hasInitialized.current && isEmptyEditor(editor)) {
      hasInitialized.current = true;
      markdownToPlatejs(editor, value).then((elements) => {
        editor.tf.reset();
        editor.tf.init({
          value: elements,
          autoSelect: false,
        });
      });
    } else {
      editor?.getPlugin(StreamContentPlugin)?.api.streamContent.stop();
    }
  }, [value, isStreaming]);
};
