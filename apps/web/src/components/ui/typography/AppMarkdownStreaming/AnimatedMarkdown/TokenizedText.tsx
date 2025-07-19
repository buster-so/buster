import React, { useMemo, useRef, useCallback } from 'react';
import type { MarkdownAnimation } from './animation-helpers';
import { createAnimationStyle } from './animation-helpers';

type TokenizedTextProps = {
  text: string;
  animation?: MarkdownAnimation;
  animationDuration?: number;
  animationTimingFunction?: 'ease-in-out' | 'ease-in' | 'ease-out' | 'linear';
  doNotAnimateInitialText?: boolean;
  isStreamFinished?: boolean;
};

const TokenizedText: React.FC<TokenizedTextProps> = React.memo(
  ({
    text,
    animation,
    animationDuration,
    animationTimingFunction,
    doNotAnimateInitialText,
    isStreamFinished
  }) => {
    const previousTextRef = useRef<string>('');
    const animatedChunksRef = useRef<string[]>([]);

    // Memoize the animation style to avoid recreating it on every render
    const animationStyle = useMemo(
      () =>
        createAnimationStyle({
          animation,
          animationDuration,
          animationTimingFunction,
          isStreamFinished
        }),
      [animation, animationDuration, animationTimingFunction]
    );

    // Memoize the span creation function to avoid recreating it on every render
    const createSpan = useCallback(
      (chunk: string, index: number) => (
        <span
          key={`animated-chunk-${index}`}
          style={doNotAnimateInitialText && index === 0 ? {} : animationStyle}>
          {chunk}
        </span>
      ),
      [animationStyle]
    );

    const content = useMemo(() => {
      const currentText = text;
      const previousText = previousTextRef.current;

      // If this is the first render or text hasn't changed, return existing content
      if (currentText === previousText) {
        const baseText = currentText.slice(
          0,
          currentText.length - animatedChunksRef.current.join('').length
        );
        const animatedSpans = animatedChunksRef.current.map(createSpan);
        return [baseText, ...animatedSpans];
      }

      // Find the new content by comparing current and previous text
      if (currentText.length > previousText.length) {
        // Text is being added - only process the new content
        const newContent = currentText.slice(previousText.length);

        // Update our stored animated chunks
        animatedChunksRef.current = [...animatedChunksRef.current, newContent];
      } else if (currentText.length < previousText.length) {
        // Text is being removed (less common in streaming scenarios)
        const removedLength = previousText.length - currentText.length;
        let totalAnimatedLength = 0;
        const newAnimatedChunks: string[] = [];

        for (const chunk of animatedChunksRef.current) {
          if (totalAnimatedLength + chunk.length <= removedLength) {
            totalAnimatedLength += chunk.length;
          } else {
            newAnimatedChunks.push(chunk);
          }
        }
        animatedChunksRef.current = newAnimatedChunks;
      } else {
        // Text has been replaced
        animatedChunksRef.current = [];
      }

      // Update the previous text reference
      previousTextRef.current = currentText;

      // Calculate the base text (text without animated chunks)
      const totalAnimatedLength = animatedChunksRef.current.join('').length;
      const baseText = currentText.slice(0, currentText.length - totalAnimatedLength);

      // Return base text and animated spans
      const animatedSpans = animatedChunksRef.current.map(createSpan);
      return [baseText, ...animatedSpans];
    }, [text, createSpan]);

    return <>{content}</>;
  }
);

TokenizedText.displayName = 'TokenizedText';

export default TokenizedText;
