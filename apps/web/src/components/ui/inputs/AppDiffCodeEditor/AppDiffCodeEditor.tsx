'use client';

import { DiffEditor } from '@monaco-editor/react';
import type { editor } from 'monaco-editor/esm/vs/editor/editor.api';
import { useTheme } from 'next-themes';
import React, { forwardRef, useMemo } from 'react';
import { useMemoizedFn } from '@/hooks';
import { cn } from '@/lib/classMerge';
import { CircleSpinnerLoaderContainer } from '../../loaders/CircleSpinnerLoaderContainer';

export interface AppDiffCodeEditorProps {
  className?: string;
  height?: string;
  isDarkMode?: boolean;
  onMount?: (editor: editor.IStandaloneDiffEditor, monaco: typeof import('monaco-editor')) => void;
  original?: string;
  modified: string;
  onChange?: (value: string) => void;
  style?: React.CSSProperties;
  language?: string;
  readOnly?: boolean;
  readOnlyMessage?: string;
  monacoEditorOptions?: editor.IStandaloneDiffEditorConstructionOptions;
  variant?: 'bordered' | null;
  viewMode?: 'side-by-side' | 'inline';
  disabled?: boolean;
}

export interface AppDiffCodeEditorHandle {
  resetCodeEditor: () => void;
}

export const AppDiffCodeEditor = forwardRef<AppDiffCodeEditorHandle, AppDiffCodeEditorProps>(
  (
    {
      style,
      monacoEditorOptions,
      language = 'sql',
      className,
      readOnly,
      onChange,
      height = '100%',
      isDarkMode,
      onMount,
      original = '',
      modified = '',
      readOnlyMessage = 'Editing code is not allowed',
      variant,
      viewMode = 'side-by-side',
      disabled = false
    },
    ref
  ) => {
    const isDarkModeContext = useTheme()?.theme === 'dark';
    const useDarkMode = isDarkMode ?? isDarkModeContext;

    const memoizedMonacoEditorOptions: editor.IStandaloneDiffEditorConstructionOptions =
      useMemo(() => {
        return {
          originalEditable: false,
          automaticLayout: true,
          readOnly: readOnly || disabled,
          renderSideBySide: viewMode === 'side-by-side',
          folding: true,
          lineDecorationsWidth: 15,
          lineNumbersMinChars: 3,
          renderOverviewRuler: false,
          wordWrap: 'on',
          scrollBeyondLastLine: true,
          scrollbar: {
            verticalScrollbarSize: 5,
            alwaysConsumeMouseWheel: false,
            useShadows: false
          },
          padding: {
            top: 10
          },
          glyphMargin: false,
          minimap: {
            enabled: false
          },
          renderSideBySideInlineBreakpoint: 400,
          compactMode: true,
          renderIndicators: false,
          onlyShowAccessibleDiffViewer: false,
          enableSplitViewResizing: false,
          renderMarginRevertIcon: false,
          contextmenu: false,
          diffWordWrap: 'on',
          readOnlyMessage: {
            value: readOnlyMessage
          },
          ...monacoEditorOptions
        } satisfies editor.IStandaloneDiffEditorConstructionOptions;
      }, [readOnlyMessage, monacoEditorOptions, viewMode, readOnly, disabled]);

    const onMountDiffEditor = useMemoizedFn(
      async (editor: editor.IStandaloneDiffEditor, monaco: typeof import('monaco-editor')) => {
        const [GithubLightTheme, NightOwlTheme] = await Promise.all([
          (await import('../AppCodeEditor/themes/github_light_theme')).default,
          (await import('../AppCodeEditor/themes/tomorrow_night_theme')).default
        ]);

        monaco.editor.defineTheme('github-light', GithubLightTheme);
        monaco.editor.defineTheme('night-owl', NightOwlTheme);

        // Apply theme to diff editor
        const theme = useDarkMode ? 'night-owl' : 'github-light';
        monaco.editor.setTheme(theme);

        // Configure original editor to always wrap text
        const originalEditor = editor.getOriginalEditor();
        originalEditor.updateOptions({
          wordWrap: 'on',
          wrappingStrategy: 'advanced',
          padding: { top: 16 },
          glyphMargin: true
        });

        // Get the modified editor and add change listener
        const modifiedEditor = editor.getModifiedEditor();
        modifiedEditor.updateOptions({
          padding: { top: 16 },
          glyphMargin: true
        });

        if (!readOnly && !disabled) {
          modifiedEditor.onDidChangeModelContent(() => {
            onChange?.(modifiedEditor.getValue() || '');
          });
        }

        onMount?.(editor, monaco);
      }
    );

    return (
      <div
        className={cn(
          'app-diff-code-editor relative h-full w-full',
          variant === 'bordered' && 'overflow-hidden border',
          className
        )}
        style={style}>
        <DiffEditor
          key={`${useDarkMode ? 'dark' : 'light'}-${viewMode}`}
          height={height}
          loading={<LoadingContainer />}
          language={language}
          className={className}
          original={original}
          modified={modified}
          theme={useDarkMode ? 'night-owl' : 'github-light'}
          onMount={onMountDiffEditor}
          options={memoizedMonacoEditorOptions}
        />
      </div>
    );
  }
);
AppDiffCodeEditor.displayName = 'AppDiffCodeEditor';

const LoadingContainer = React.memo(() => {
  return <CircleSpinnerLoaderContainer className="animate-in fade-in-0 duration-300" />;
});
LoadingContainer.displayName = 'LoadingContainer';
