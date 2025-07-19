import type { BlockMatch } from '@llm-ui/react';
import AnimatedMarkdown from './AnimatedMarkdown';
import React from 'react';
import { useAppMarkdownStreaming } from '../AppMarkdownStreaming';

type LLMAnimatedMarkdownProps = {
  blockMatch: BlockMatch;
};

export const LLMAnimatedMarkdown: React.FC<LLMAnimatedMarkdownProps> = ({ blockMatch }) => {
  const markdown = blockMatch.output;
  const {
    animation,
    isStreamFinished,
    isThrottleStreamingFinished,
    animationDuration,
    animationTimingFunction
  } = useAppMarkdownStreaming();

  return (
    <AnimatedMarkdown
      content={markdown}
      isStreamFinished={blockMatch.isComplete || isThrottleStreamingFinished}
      animation={animation}
      animationDuration={animationDuration}
      animationTimingFunction={animationTimingFunction}
    />
  );
};

export default LLMAnimatedMarkdown;
