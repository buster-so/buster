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

const throttle = throttleBasic();

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
    onFinish: () => {
      console.log('finished');
    },
    isStreamFinished
  });

  console.log(isStreamFinished, visibleText);

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
