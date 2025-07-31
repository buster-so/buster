import { useEffect, useState } from 'react';
import { getHighlightedCode } from './shiki-instance';
import { useAsyncEffect } from '@/hooks';

export const useCodeHighlighter = (code: string, language: 'sql' | 'yaml') => {
  const [highlightedCode, setHighlightedCode] = useState(code);

  useAsyncEffect(async () => {
    const highlighter = await getHighlightedCode(code, language, 'github-light');
    setHighlightedCode(highlighter);

    return () => {
      //
    };
  }, [code, language]);

  return highlightedCode;
};
