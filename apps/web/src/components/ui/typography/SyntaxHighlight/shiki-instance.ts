'use client';

import type { ShikiTransformer, HighlighterCore } from 'shiki';
import { createHighlighterCore } from 'shiki/core';
import { createOnigurumaEngine } from 'shiki/engine/oniguruma';
import githubLight from '@shikijs/themes/github-light';
import githubDark from '@shikijs/themes/github-dark';

// Singleton instance
let highlighterInstance: HighlighterCore | null = null;
let initializationPromise: Promise<HighlighterCore> | null = null;

// Initialize the highlighter with pre-loaded languages and themes
export const initializeHighlighter = async (): Promise<HighlighterCore> => {
  // Return existing instance if available
  if (highlighterInstance) {
    return highlighterInstance;
  }

  // Return ongoing initialization if in progress
  if (initializationPromise) {
    return initializationPromise;
  }

  // Start initialization
  initializationPromise = createHighlighterCore({
    themes: [githubLight, githubDark],
    langs: [() => import('@shikijs/langs/sql'), () => import('@shikijs/langs/yaml')],
    engine: createOnigurumaEngine(import('shiki/wasm'))
  });

  try {
    highlighterInstance = await initializationPromise;
    return highlighterInstance;
  } catch (error) {
    // Reset on error so it can be retried
    initializationPromise = null;
    throw error;
  }
};

// Highlight code
export const getHighlightedCode = async (
  code: string,
  language: 'sql' | 'yaml',
  theme: 'github-light' | 'github-dark',
  transformers?: ShikiTransformer[]
): Promise<string> => {
  // Get or initialize highlighter
  const highlighter = await initializeHighlighter();

  // Generate highlighted HTML
  const html = highlighter.codeToHtml(code, {
    lang: language,
    theme,
    transformers
  });

  return html;
};

// Get tokens for code
export const getCodeTokens = async (
  code: string,
  language: 'sql' | 'yaml',
  theme: 'github-light' | 'github-dark'
) => {
  const highlighter = await initializeHighlighter();
  return highlighter.codeToTokens(code, {
    lang: language,
    theme
  });
};

// Note: Do not pre-initialize on module load to keep initial memory low. Highlighter will
// initialize on first use via getHighlightedCode/getCodeTokens.

export const getFallbackStyle = (isDarkMode: boolean) => {
  return {
    background: isDarkMode ? githubDark.bg : githubLight.bg,
    color: isDarkMode ? githubDark.fg : githubLight.fg
  };
};
