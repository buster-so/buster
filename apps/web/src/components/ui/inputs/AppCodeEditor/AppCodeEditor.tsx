'use client';

//https://github.com/popsql/monaco-sql-languages/blob/main/example/src/App.js#L2
//https://dtstack.github.io/monaco-sql-languages/

import './MonacoWebWorker';

import type { editor } from 'monaco-editor/esm/vs/editor/editor.api';
import React, { forwardRef, useMemo } from 'react';
import { useMemoizedFn } from '@/hooks';
import { cn } from '@/lib/classMerge';
import { CircleSpinnerLoaderContainer } from '../../loaders/CircleSpinnerLoaderContainer';
import { configureMonacoToUseYaml } from './yamlHelper';

//import GithubLightTheme from 'monaco-themes/themes/Github Light.json';
//import NightOwnTheme from 'monaco-themes/themes/Night Owl.json';
//https://github.com/brijeshb42/monaco-ace-tokenizer

import dynamic from 'next/dynamic';
const Editor = dynamic(() => import('@monaco-editor/react').then((m) => m.Editor), {
  ssr: false,
  loading: () => null
});
import { useTheme } from 'next-themes';

interface AppCodeEditorProps {
  className?: string;
  onChangeEditorHeight?: (height: number) => void;
  height?: string;
  isDarkMode?: boolean;
  onMount?: (editor: editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => void;
  value?: string;
  onChange?: (value: string) => void;
  style?: React.CSSProperties;
  language?: string;
  readOnly?: boolean;
  readOnlyMessage?: string;
  defaultValue?: string;
  monacoEditorOptions?: editor.IStandaloneEditorConstructionOptions;
  variant?: 'bordered' | null;
  onMetaEnter?: () => void;
}

export interface AppCodeEditorHandle {
  resetCodeEditor: () => void;
}

export const AppCodeEditor = forwardRef<AppCodeEditorHandle, AppCodeEditorProps>(
  (
    {
      style,
      monacoEditorOptions,
      defaultValue = '',
      language = 'pgsql',
      className,
      readOnly,
      onChange,
      onChangeEditorHeight,
      height = '100%',
      isDarkMode,
      onMount,
      value,
      readOnlyMessage = 'Editing code is not allowed',
      variant,
      onMetaEnter
    },
    ref
  ) => {
    // const { cx, styles } = useStyles();

    const isDarkModeContext = useTheme()?.theme === 'dark';
    const useDarkMode = isDarkMode ?? isDarkModeContext;

    const memoizedMonacoEditorOptions: editor.IStandaloneEditorConstructionOptions = useMemo(() => {
      return {
        language,
        readOnly,
        folding: true,
        lineDecorationsWidth: 15,
        lineNumbersMinChars: 3,
        tabSize: 7,
        wordWrap: 'off',
        wordWrapColumn: 999,
        wrappingStrategy: 'simple',
        overviewRulerLanes: 0,
        scrollBeyondLastLine: false,
        minimap: {
          enabled: false
        },
        scrollbar: {
          horizontalScrollbarSize: 5,
          verticalScrollbarSize: 5,
          alwaysConsumeMouseWheel: false,
          useShadows: false
        },
        padding: {
          top: 10
        },
        hover: {
          enabled: false
        },
        contextmenu: false,
        readOnlyMessage: {
          value: readOnlyMessage
        },
        ...monacoEditorOptions
      };
    }, [readOnlyMessage, monacoEditorOptions]);

    const onMountCodeEditor = useMemoizedFn(
      async (editor: editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => {
        const [GithubLightTheme, NightOwlTheme] = await Promise.all([
          (await import('./themes/github_light_theme')).default,
          (await import('./themes/tomorrow_night_theme')).default
        ]);

        monaco.editor.defineTheme('github-light', GithubLightTheme);
        monaco.editor.defineTheme('night-owl', NightOwlTheme);
        editor.updateOptions({
          theme: useDarkMode ? 'night-owl' : 'github-light',
          colorDecorators: true
        });
        if (onChangeEditorHeight) {
          editor.onDidContentSizeChange(() => {
            const contentHeight = editor.getContentHeight();
            onChangeEditorHeight(contentHeight);
          });
        }

        if (language === 'yaml') {
          await configureMonacoToUseYaml(monaco);
        }

        onMount?.(editor, monaco);

        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
          onMetaEnter?.();
        });
      }
    );

    const onChangeCodeEditor = useMemoizedFn((v: string | undefined) => {
      if (!readOnly) {
        onChange?.(v || '');
      }
    });

    return (
      <div
        className={cn(
          'app-code-editor relative h-full w-full border',
          variant === 'bordered' && 'overflow-hidden border',
          className
        )}
        style={style}>
        <Editor
          key={useDarkMode ? 'dark' : 'light'}
          height={height}
          loading={<LoadingContainer />}
          language={language}
          className={className}
          defaultValue={defaultValue}
          value={value}
          theme={useDarkMode ? 'night-owl' : 'github-light'}
          onMount={onMountCodeEditor}
          onChange={onChangeCodeEditor}
          options={memoizedMonacoEditorOptions}
        />
      </div>
    );
  }
);
AppCodeEditor.displayName = 'AppCodeEditor';

const LoadingContainer = () => {
  return <CircleSpinnerLoaderContainer className="animate-in fade-in-0 duration-300" />;
};
