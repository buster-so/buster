'use client';

import type { LLMOutputComponent } from '@llm-ui/react';
import React from 'react';
import { CodeComponent } from './AnimatedMarkdown/MarkdownComponent';
import { useAppMarkdownStreaming } from './AppMarkdownStreaming';

const CodeComponentStreaming: LLMOutputComponent = ({ blockMatch }) => {
  const markdown = blockMatch.output;
  const codeBlockRegex = /^```(\w+)?/;
  const match = blockMatch.output.match(codeBlockRegex);
  const language = match && match[1] ? match[1] : '';
  const { isStreamFinished } = useAppMarkdownStreaming();

  if (!language) {
    return null;
  }

  return (
    <CodeComponent language={language} isStreamFinished={isStreamFinished}>
      {markdown}
    </CodeComponent>
  );
};

export default CodeComponentStreaming;
