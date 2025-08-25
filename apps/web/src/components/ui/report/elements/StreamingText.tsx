'use client';

import React from 'react';
import type { PlateTextProps } from 'platejs/react';
import { PlateText, usePluginOption } from 'platejs/react';
import { cn } from '@/lib/utils';
import { StreamContentPlugin } from '../plugins/stream-content-plugin';

export function StreamingText(props: PlateTextProps) {
  const isStreaming = usePluginOption(StreamContentPlugin, 'isStreaming');

  const isLastStreamingText = isStreaming && false;

  return (
    <PlateText
      className={cn(
        'streaming-node',
        isStreaming && 'animate-highlight-fade',
        // Only show the animated dot on the last streaming text node
        isLastStreamingText && [
          'after:ml-1.5 after:inline-block after:h-3 after:w-3 after:animate-pulse after:rounded-full after:bg-purple-500 after:align-middle after:content-[""]'
        ]
      )}
      {...props}
    />
  );
}
