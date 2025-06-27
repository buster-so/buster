import React from 'react';
import { type LLMOutputComponent } from '@llm-ui/react';
import { AppMarkdown } from '../AppMarkdown';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const MarkdownComponent: LLMOutputComponent = ({ blockMatch }) => {
  const markdown = blockMatch.output;
  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>;
};
