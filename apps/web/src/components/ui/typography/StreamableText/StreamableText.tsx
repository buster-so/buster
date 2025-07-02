'use client';
import { codeBlockLookBack, findCompleteCodeBlock, findPartialCodeBlock } from '@llm-ui/code';
import { markdownLookBack } from '@llm-ui/markdown';
<<<<<<< HEAD
import { useLLMOutput } from '@llm-ui/react';
=======
import { throttleBasic, useLLMOutput, useStreamExample } from '@llm-ui/react';
>>>>>>> staging
import { MarkdownComponent } from './MarkdownComponent';
import { CodeBlock } from './CodeBlockComponent';

export interface StreamableTextProps {
  message: string;
  isStreamFinished?: boolean;
}

<<<<<<< HEAD
=======
const throttle = throttleBasic();

>>>>>>> staging
export const StreamableText = ({
  message: llmOutput,
  isStreamFinished = false
}: StreamableTextProps) => {
<<<<<<< HEAD
  const { blockMatches, visibleText } = useLLMOutput({
=======
  const { blockMatches, visibleText, ...rest } = useLLMOutput({
>>>>>>> staging
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
<<<<<<< HEAD
    isStreamFinished
  });

=======
    throttle,
    onFinish: () => {
      console.log('finished');
    },
    isStreamFinished
  });

  console.log(isStreamFinished, visibleText);

>>>>>>> staging
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
