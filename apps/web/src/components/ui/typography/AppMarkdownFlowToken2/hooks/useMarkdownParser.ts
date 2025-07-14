import { useMemo } from 'react';
import type { MarkdownToken } from '../types';
import { 
  parseMarkdownTokens, 
  extractPlainText, 
  preserveMarkdownFormatting,
  isCodeBlock,
  extractCodeLanguage,
  extractCodeContent
} from '../utils/markdown';

export interface UseMarkdownParserProps {
  content: string;
  enableParsing?: boolean;
}

export interface UseMarkdownParserReturn {
  tokens: MarkdownToken[];
  plainText: string;
  hasCodeBlocks: boolean;
  hasImages: boolean;
  hasLinks: boolean;
  formattedContent: (displayedLength: number) => string;
  isMarkdown: boolean;
}

export const useMarkdownParser = ({
  content,
  enableParsing = true,
}: UseMarkdownParserProps): UseMarkdownParserReturn => {
  const tokens = useMemo(() => {
    if (!enableParsing) return [];
    return parseMarkdownTokens(content);
  }, [content, enableParsing]);

  const plainText = useMemo(() => {
    return extractPlainText(content);
  }, [content]);

  const hasCodeBlocks = useMemo(() => {
    return tokens.some(token => token.type === 'code') || isCodeBlock(content);
  }, [tokens, content]);

  const hasImages = useMemo(() => {
    return tokens.some(token => token.type === 'image');
  }, [tokens]);

  const hasLinks = useMemo(() => {
    return tokens.some(token => token.type === 'link');
  }, [tokens]);

  const isMarkdown = useMemo(() => {
    return tokens.length > 0 && tokens.some(token => token.type !== 'text');
  }, [tokens]);

  const formattedContent = useMemo(() => {
    return (displayedLength: number) => {
      if (!enableParsing) return content.slice(0, displayedLength);
      return preserveMarkdownFormatting(content, displayedLength);
    };
  }, [content, enableParsing]);

  return {
    tokens,
    plainText,
    hasCodeBlocks,
    hasImages,
    hasLinks,
    formattedContent,
    isMarkdown,
  };
};