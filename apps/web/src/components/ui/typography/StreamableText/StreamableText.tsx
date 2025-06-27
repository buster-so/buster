'use client';
import { codeBlockLookBack, findCompleteCodeBlock, findPartialCodeBlock } from '@llm-ui/code';
import { markdownLookBack } from '@llm-ui/markdown';
import { throttleBasic, useLLMOutput, useStreamExample } from '@llm-ui/react';
import { MarkdownComponent } from './MarkdownComponent';
import { CodeBlock } from './CodeBlockComponent';

export interface StreamableTextProps {
  message: string;
  isStreamFinished?: boolean;
}

const throttle = throttleBasic({
  readAheadChars: 10,
  targetBufferChars: 10,
  adjustPercentage: 0.22,
  frameLookBackMs: 12000,
  windowLookBackMs: 2000
});

export const StreamableText = ({
  message: llmOutput,
  isStreamFinished = false
}: StreamableTextProps) => {
  const { blockMatches, visibleText, ...rest } = useLLMOutput({
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
    throttle,
    isStreamFinished: true
  });

  console.log({ blockMatches, isStreamFinished, rest });

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
