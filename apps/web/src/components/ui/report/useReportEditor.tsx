import { type Value } from 'platejs';
import {
  useEditorRef,
  usePlateEditor,
  type TPlateEditor,
  type WithPlateOptions
} from 'platejs/react';
import { useMemo } from 'react';

import { EditorKit } from './editor-kit';
import { FIXED_TOOLBAR_KIT_KEY } from './plugins/fixed-toolbar-kit';

const USE_DEPENDENCIES = true;

export const useReportEditor = (
  {
    value,
    disabled,
    onReady,
    useFixedToolbarKit = false
  }: {
    value: Value;
    disabled: boolean;
    onReady?: (ctx: WithPlateOptions) => void;
    useFixedToolbarKit?: boolean;
  },
  deps: unknown[] = [value] // Add dependencies array with value as default
) => {
  const plugins = useMemo(() => {
    const filteredKeys: string[] = [];
    if (!useFixedToolbarKit) {
      filteredKeys.push(FIXED_TOOLBAR_KIT_KEY);
    }

    if (filteredKeys.length > 0) {
      return EditorKit.filter((plugin) => !filteredKeys.includes(plugin.key));
    }

    return EditorKit;
  }, [useFixedToolbarKit]);

  return usePlateEditor(
    {
      plugins,
      value,
      readOnly: disabled,
      onReady
    },
    USE_DEPENDENCIES ? deps : undefined
  ); // Pass dependencies to usePlateEditor
};

export type ReportEditor = TPlateEditor<Value, (typeof EditorKit)[number]>;

export const useEditor = () => useEditorRef<ReportEditor>();
