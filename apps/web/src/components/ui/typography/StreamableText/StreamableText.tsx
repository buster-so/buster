'use client';
import { codeBlockLookBack, findCompleteCodeBlock, findPartialCodeBlock } from '@llm-ui/code';
import { markdownLookBack } from '@llm-ui/markdown';
import { useLLMOutput } from '@llm-ui/react';
import { MarkdownComponent } from './MarkdownComponent';
import { CodeBlock } from './CodeBlockComponent';

export interface StreamableTextProps {
  message: string;
  isStreamFinished?: boolean;
}

export const StreamableText = ({
  message: llmOutput,
  isStreamFinished = false
}: StreamableTextProps) => {
  const { blockMatches, visibleText } = useLLMOutput({
    llmOutput,
    fallbackBlock: {
      component: MarkdownComponent,
      lookBack: markdownLookBack()
    },
    blocks: [
      {
        component: CodeBlock,
        findCompleteMatch: findCompleteCodeBlock(),
        findPartialMatch: findPartialCodeBlock(),
        lookBack: codeBlockLookBack()
      }
    ],
    isStreamFinished
  });

  return (
    <div>
      {blockMatches.length ? (
        blockMatches.map((m, i) => {
          const C = m.block.component;
          return <C key={i} blockMatch={m} />;
        })
      ) : (
        <span>{visibleText}</span>
      )}
    </div>
  );
};
