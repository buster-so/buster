'use client';

import React, { useEffect, useRef, useTransition } from 'react';
import { useMemoizedFn } from '@/hooks';
import { cn } from '@/lib/classMerge';

interface StreamingMessage_TextProps {
  isCompletedStream: boolean;
  message: string;
}

export const StreamingMessage_Text: React.FC<StreamingMessage_TextProps> = React.memo(
  ({ message, isCompletedStream }) => {
    const [isPending, startTransition] = useTransition();
    const textChunksRef = useRef<string[]>([]);

    const setTextChunks = useMemoizedFn((updater: (prevChunks: string[]) => string[]) => {
      textChunksRef.current = updater(textChunksRef.current);
      startTransition(() => {
        //just used to trigger UI update
      });
    });

    useEffect(() => {
      if (message) {
        // Handle complete message
        const currentText = textChunksRef.current.join('');

        if (message.startsWith(currentText)) {
          const remainingText = message.slice(currentText.length);
          if (remainingText) {
            setTextChunks((prevChunks) => [...prevChunks, remainingText]);
          }
        } else {
          // If there's a mismatch, just use the complete message
          setTextChunks(() => [message]);
        }
      }
    }, [message]);

    return (
      <div className={'whitespace-pre-wrap'}>
        {textChunksRef.current.map((chunk, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: we need to use the index as the key for animation
          <AnimatedSpan key={index} isCompletedStream={isCompletedStream}>
            {chunk}
          </AnimatedSpan>
        ))}
      </div>
    );
  }
);

const AnimatedSpan: React.FC<{ children: React.ReactNode; isCompletedStream: boolean }> = ({
  children,
  isCompletedStream
}) => {
  return (
    <span className={cn('leading-1.5', !isCompletedStream ? 'fade-in duration-500' : '')}>
      {children}
    </span>
  );
};

StreamingMessage_Text.displayName = 'StreamingMessage_Text';
