import { type Value } from 'platejs';
import { useEditorRef, usePlateEditor, type TPlateEditor } from 'platejs/react';
import { useEffect, useMemo, useState } from 'react';
import { FIXED_TOOLBAR_KIT_KEY } from './plugins/fixed-toolbar-kit';
import { BaseEditorKit } from './base-editor-kit';
import { loadHeavyEditorKits } from './load-heavy-editor-kits';
import type { IReportEditor } from './ReportEditor';

export const useReportEditor = ({
  value,
  disabled,
  onReady,
  useFixedToolbarKit = false
}: {
  value: Value;
  disabled: boolean;
  onReady?: (editor: IReportEditor) => void;
  useFixedToolbarKit?: boolean;
}) => {
  const basePlugins = useMemo(() => {
    if (useFixedToolbarKit) return BaseEditorKit;
    return BaseEditorKit.filter((plugin) => plugin.key !== FIXED_TOOLBAR_KIT_KEY);
  }, [useFixedToolbarKit]);

  const [plugins, setPlugins] = useState(basePlugins);

  useEffect(() => {
    setPlugins(basePlugins);
  }, [basePlugins]);

  useEffect(() => {
    const schedule = (cb: () => void) => {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(cb, { timeout: 3000 });
      } else {
        setTimeout(cb, 1500);
      }
    };
    let cancelled = false;
    schedule(async () => {
      const heavy = await loadHeavyEditorKits();
      if (!cancelled) {
        setPlugins((prev) => {
          const keys = new Set(prev.map((p) => p.key));
          const toAdd = heavy.filter((p) => !keys.has(p.key));
          return [...prev, ...toAdd];
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return usePlateEditor({
    plugins,
    value,
    readOnly: disabled,
    onReady: ({ editor }) => onReady?.(editor)
  });
};

export type ReportEditor = TPlateEditor<Value, any>;

export const useEditor = () => useEditorRef<ReportEditor>();
