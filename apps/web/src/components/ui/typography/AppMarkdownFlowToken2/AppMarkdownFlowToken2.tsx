import React from 'react';
import type { AppMarkdownFlowToken2Props } from './types';
import { AnimatedText } from './components/AnimatedText';
import { AnimatedMarkdown } from './components/AnimatedMarkdown';
import { useMarkdownParser } from './hooks/useMarkdownParser';

export const AppMarkdownFlowToken2: React.FC<AppMarkdownFlowToken2Props> = ({
  // FlowToken compatibility props
  content,
  speed = 50,
  cursor = true,
  cursorChar,
  cursorClassName,
  className,
  onComplete,
  
  // Throttling enhancements
  throttleRate = 500,
  isStreaming = false,
  enableThrottling = true,
  
  // Markdown specific
  renderCodeBlocks = true,
  renderImages = true,
  renderLinks = true,
  animationType = 'typewriter',
}) => {
  const { isMarkdown } = useMarkdownParser({
    content,
    enableParsing: true,
  });

  // Convert FlowToken props to our internal props
  const animationSpeed = speed;
  const showCursor = cursor;
  const cursorStyle: 'blink' | 'solid' | 'underline' = 'blink'; // Default, could be made configurable

  // If content contains markdown, use AnimatedMarkdown
  if (isMarkdown) {
    return (
      <AnimatedMarkdown
        markdown={content}
        content={content}
        isStreaming={isStreaming}
        animationSpeed={animationSpeed}
        showCursor={showCursor}
        cursorStyle={cursorStyle}
        animationType={animationType}
        onComplete={onComplete}
        throttleRate={throttleRate}
        enableThrottling={enableThrottling}
        renderCodeBlocks={renderCodeBlocks}
        renderImages={renderImages}
        renderLinks={renderLinks}
        className={className}
      />
    );
  }

  // For plain text, use AnimatedText
  return (
    <AnimatedText
      content={content}
      isStreaming={isStreaming}
      animationSpeed={animationSpeed}
      showCursor={showCursor}
      cursorStyle={cursorStyle}
      animationType={animationType}
      onComplete={onComplete}
      throttleRate={throttleRate}
      enableThrottling={enableThrottling}
      className={className}
    />
  );
};