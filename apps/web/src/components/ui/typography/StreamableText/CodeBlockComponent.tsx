'use client';

<<<<<<< HEAD
import { type LLMOutputComponent } from '@llm-ui/react';
import { AppCodeBlock } from '../AppCodeBlock';
import React from 'react';
import { useWhyDidYouUpdate } from '@/hooks';

// Customize this component with your own styling
export const CodeBlock: LLMOutputComponent = React.memo(({ blockMatch }) => {
  if (!blockMatch.visibleText) return null;
  const language = blockMatch.output.match(/```(\w+)/)?.[1];

  return <AppCodeBlock language={language || 'yaml'}>{blockMatch.visibleText}</AppCodeBlock>;
});

CodeBlock.displayName = 'CodeBlock';
=======
import type { CodeToHtmlOptions } from '@llm-ui/code';
import {
  allLangs,
  allLangsAlias,
  codeBlockLookBack,
  findCompleteCodeBlock,
  findPartialCodeBlock,
  loadHighlighter,
  useCodeBlockToHtml
} from '@llm-ui/code';
import { markdownLookBack } from '@llm-ui/markdown';
import { useLLMOutput, useStreamExample, type LLMOutputComponent } from '@llm-ui/react';
import parseHtml from 'html-react-parser';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getHighlighterCore } from 'shiki/core';
import { bundledLanguagesInfo } from 'shiki/langs';
// WARNING: Importing bundledThemes will increase your bundle size
// see: https://llm-ui.com/docs/blocks/code#bundle-size
import { bundledThemes } from 'shiki/themes';
import getWasm from 'shiki/wasm';

const highlighter = loadHighlighter(
  getHighlighterCore({
    langs: allLangs(bundledLanguagesInfo),
    langAlias: allLangsAlias(bundledLanguagesInfo),
    themes: Object.values(bundledThemes),
    loadWasm: getWasm
  })
);

const codeToHtmlOptions: CodeToHtmlOptions = {
  theme: 'github-dark'
};

// Customize this component with your own styling
export const CodeBlock: LLMOutputComponent = ({ blockMatch }) => {
  const { html, code } = useCodeBlockToHtml({
    markdownCodeBlock: blockMatch.output,
    highlighter,
    codeToHtmlOptions
  });
  if (!html) {
    // fallback to <pre> if Shiki is not loaded yet
    return (
      <pre className="shiki">
        <code>{code}</code>
      </pre>
    );
  }
  return <>{parseHtml(html)}</>;
};
>>>>>>> staging
