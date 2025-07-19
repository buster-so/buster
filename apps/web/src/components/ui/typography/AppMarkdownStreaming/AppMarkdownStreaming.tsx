'use client';
import { codeBlockLookBack, findCompleteCodeBlock, findPartialCodeBlock } from '@llm-ui/code';
import { markdownLookBack } from '@llm-ui/markdown';
import { throttleBasic, useLLMOutput } from '@llm-ui/react';
import { LLMAnimatedMarkdown } from './AnimatedMarkdown/LLMAnimatedMarkdown';
import CodeComponentStreaming from './CodeComponentStreaming';
import React, { useContext } from 'react';
import type {
  MarkdownAnimation,
  MarkdownAnimationTimingFunction
} from './AnimatedMarkdown/animation-helpers';
import { createContext } from 'react';

const throttle = throttleBasic({
  // show output as soon as it arrives
  readAheadChars: 0,
  // stay literally at the LLM’s pace
  targetBufferChars: 10,
  adjustPercentage: 0.4,
  frameLookBackMs: 10000,
  // split that into 250 ms windows for smoothing
  windowLookBackMs: 250
});

const AppMarkdownStreaming = ({
  content,
  isStreamFinished,
  animation,
  animationDuration,
  animationTimingFunction
}: {
  content: string;
  isStreamFinished: boolean;
  animation?: MarkdownAnimation;
  animationDuration?: number;
  animationTimingFunction?: MarkdownAnimationTimingFunction;
}) => {
  const { blockMatches, isFinished, ...rest } = useLLMOutput({
    llmOutput: content,
    fallbackBlock: {
      component: LLMAnimatedMarkdown,
      lookBack: markdownLookBack()
    },
    blocks: [
      {
        component: CodeComponentStreaming,
        findCompleteMatch: findCompleteCodeBlock(),
        findPartialMatch: findPartialCodeBlock(),
        lookBack: codeBlockLookBack()
      }
    ],
    isStreamFinished,
    throttle
  });

  return (
    <AppMarkdownStreamingContext.Provider
      value={{
        animation,
        animationDuration,
        animationTimingFunction,
        isStreamFinished,
        isThrottleStreamingFinished: isFinished
      }}>
      <div className="flex flex-col space-y-2.5">
        {blockMatches.map((blockMatch, index) => {
          const Component = blockMatch.block.component;
          return <Component key={index} blockMatch={blockMatch} />;
        })}
      </div>
    </AppMarkdownStreamingContext.Provider>
  );
};

export default AppMarkdownStreaming;

const AppMarkdownStreamingContext = createContext<{
  animation?: MarkdownAnimation;
  animationDuration?: number;
  animationTimingFunction?: MarkdownAnimationTimingFunction;
  isStreamFinished: boolean;
  isThrottleStreamingFinished: boolean;
}>({
  animation: 'fadeIn',
  animationDuration: 700,
  animationTimingFunction: 'ease-in-out',
  isStreamFinished: false,
  isThrottleStreamingFinished: false
});

export const useAppMarkdownStreaming = () => {
  return useContext(AppMarkdownStreamingContext);
};
