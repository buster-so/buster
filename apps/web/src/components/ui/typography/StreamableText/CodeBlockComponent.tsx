'use client';

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
