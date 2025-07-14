import React from 'react';
import type { AnimatedTextProps } from '../types';
import { useStreamingThrottle } from '../hooks/useStreamingThrottle';
import { 
  getCursorClasses, 
  getDefaultCursorChar, 
  shouldShowCursor,
  getAnimationClasses 
} from '../utils/animation';
import { SplitText } from './SplitText';

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  content,
  isStreaming = false,
  animationSpeed = 50,
  showCursor = true,
  cursorStyle = 'blink',
  animationType = 'typewriter',
  onComplete,
  throttleRate = 500,
  enableThrottling = true,
  className,
}) => {
  const {
    displayedContent,
    isAnimating,
    progress,
    pause,
    resume,
    skip,
  } = useStreamingThrottle({
    content,
    throttleRate: enableThrottling ? throttleRate : 60000, // Very high rate to disable throttling
    isStreaming,
    onComplete,
  });

  const cursorChar = getDefaultCursorChar(cursorStyle);
  const showCursorElement = shouldShowCursor(isAnimating, showCursor, content, displayedContent);

  if (animationType === 'none' || !enableThrottling) {
    return (
      <span className={className}>
        {displayedContent}
        {showCursorElement && (
          <span className={getCursorClasses(cursorStyle, true)}>
            {cursorChar}
          </span>
        )}
      </span>
    );
  }

  return (
    <span className={className}>
      <SplitText
        text={displayedContent}
        splitBy="character"
        preserveWhitespace={true}
      >
        {(chunks, index) => {
          const isVisible = index < displayedContent.length;
          const delay = (index * animationSpeed) / 1000;
          
          return (
            <span
              key={index}
              className={getAnimationClasses(animationType, isVisible)}
              style={{
                animationDelay: `${delay}s`,
                display: chunks[index] === ' ' ? 'inline' : 'inline-block',
              }}
            >
              {chunks[index] === ' ' ? '\u00A0' : chunks[index]}
            </span>
          );
        }}
      </SplitText>
      {showCursorElement && (
        <span className={getCursorClasses(cursorStyle, true)}>
          {cursorChar}
        </span>
      )}
    </span>
  );
};