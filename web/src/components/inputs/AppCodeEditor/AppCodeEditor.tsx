'use client';

//https://github.com/popsql/monaco-sql-languages/blob/main/example/src/App.js#L2
//https://dtstack.github.io/monaco-sql-languages/

import React, { forwardRef, useLayoutEffect, useMemo } from 'react';
import type { editor } from 'monaco-editor/esm/vs/editor/editor.api';
import dynamic from 'next/dynamic';
import { CircleSpinnerLoaderContainer } from '../../loaders/CircleSpinnerLoaderContainer';
import { useBusterStylesContext } from '@/context/BusterStyles/BusterStyles';
import { createStyles } from 'antd-style';
import { motion } from 'framer-motion';
import { useMemoizedFn } from 'ahooks';

import './MonacoWebWorker';
import { configureMonacoToUseYaml } from './yamlHelper';

//import GithubLightTheme from 'monaco-themes/themes/Github Light.json';
//import NightOwnTheme from 'monaco-themes/themes/Night Owl.json';
//https://github.com/brijeshb42/monaco-ace-tokenizer

let hasLoadedDynamicEditor = false;
export const DynamicEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => null
});

const useStyles = createStyles(({ token }) => ({
  code: {
    fontSize: '13px',
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    '--font-app': 'Menlo, Monaco, "Courier New", monospace'
  },
  bordered: {
    border: `0.5px solid ${token.colorBorder}`,
    borderRadius: `${token.borderRadiusLG}px`,
    overflow: 'hidden'
  }
}));

export interface AppCodeEditorProps {
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
  variant?: 'bordered';
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
    const { cx, styles } = useStyles();

    const isDarkModeContext = useBusterStylesContext((s) => s.isDarkMode);
    const [isLoading, setIsLoading] = React.useState(true);
    const useDarkMode = isDarkMode ?? isDarkModeContext;

    const memoizedMonacoEditorOptions: editor.IStandaloneEditorConstructionOptions = useMemo(() => {
      return {
        language,
        readOnly,
        folding: false,
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

        if (language === 'yaml') {
          await configureMonacoToUseYaml(monaco);
        }

        monaco.editor.defineTheme('github-light', GithubLightTheme);
        monaco.editor.defineTheme('night-owl', NightOwlTheme);
        editor.updateOptions({
          theme: useDarkMode ? 'night-owl' : 'github-light'
        });
        if (onChangeEditorHeight) {
          editor.onDidContentSizeChange(() => {
            const contentHeight = editor.getContentHeight();
            onChangeEditorHeight(contentHeight);
          });
        }
        onMount?.(editor, monaco);

        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
          onMetaEnter?.();
        });

        setIsLoading(false);
        hasLoadedDynamicEditor = true;
      }
    );

    const onChangeCodeEditor = useMemoizedFn((v: string | undefined) => {
      if (!readOnly) {
        onChange?.(v || '');
      }
    });

    useLayoutEffect(() => {
      if (hasLoadedDynamicEditor) {
        setIsLoading(false);
      }
    }, [hasLoadedDynamicEditor]);

    return (
      <div
        className={cx('app-code-editor relative h-full w-full', className, styles.code, {
          [styles.bordered]: variant === 'bordered'
        })}
        style={style}>
        <DynamicEditor
          key={useDarkMode ? 'dark' : 'light'}
          height={height}
          loading={null}
          language={language}
          className={`${className} ${isLoading ? 'pointer-events-none opacity-0' : ''}`}
          defaultValue={defaultValue}
          value={value}
          theme={useDarkMode ? 'night-owl' : 'github-light'}
          onMount={onMountCodeEditor}
          onChange={onChangeCodeEditor}
          options={memoizedMonacoEditorOptions}
        />

        {isLoading && (
          <motion.div
            className="z-1 absolute bottom-0 left-0 right-0 top-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, delay: 0.15 }}>
            <CircleSpinnerLoaderContainer />
          </motion.div>
        )}
      </div>
    );
  }
);
AppCodeEditor.displayName = 'AppCodeEditor';
