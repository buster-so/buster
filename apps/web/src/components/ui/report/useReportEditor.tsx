import { type Value } from 'platejs';
import {
  useEditorRef,
  usePlateEditor,
  type TPlateEditor,
  type WithPlateOptions
} from 'platejs/react';

import { AllEditorPlugins } from './all-editor-plugins';

const USE_DEPENDENCIES = true;

export const useReportEditor = (
  {
    value,
    disabled,
    onReady
  }: {
    value: Value;
    disabled: boolean;
    onReady?: (ctx: WithPlateOptions) => void;
  },
  deps: unknown[] = [value] // Add dependencies array with value as default
) => {
  return usePlateEditor(
    {
      plugins: AllEditorPlugins,
      value,
      readOnly: disabled,
      onReady
    },
    USE_DEPENDENCIES ? deps : undefined
  ); // Pass dependencies to usePlateEditor
};

export type ReportEditor = TPlateEditor<Value, (typeof AllEditorPlugins)[number]>;

export const useEditor = () => useEditorRef<ReportEditor>();
