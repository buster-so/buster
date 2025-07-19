'use client';

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useMarkdownComponents } from './useMarkdownComponents';
import { MarkdownAnimation } from './animation-helpers';
import styles from './AnimatedMarkdown.module.css';
import { cn } from '@/lib/classMerge';
import './animations.css';

export interface AnimatedMarkdownProps {
  className?: string;
  content: string;
  animation?: MarkdownAnimation;
  animationDuration?: number;
  isStreamFinished: boolean;
  stripFormatting?: boolean;
  animationTimingFunction?: 'ease-in-out' | 'ease-in' | 'ease-out' | 'linear';
}

const remarkPlugins = [remarkGfm];
const rehypePlugins = [rehypeRaw];

const AnimatedMarkdown: React.FC<AnimatedMarkdownProps> = ({
  content,
  animation = 'fadeIn',
  animationDuration = 700,
  animationTimingFunction = 'ease-in-out',
  isStreamFinished = true,
  stripFormatting = false,
  className
}) => {
  const optimizedContent = useMemo(() => {
    return content;
  }, [content]);

  const { components } = useMarkdownComponents({
    animation,
    animationDuration,
    animationTimingFunction,
    isStreamFinished,
    stripFormatting
  });

  return (
    <div className={cn(styles.container, 'flex flex-col space-y-2 leading-1.5', className)}>
      <ReactMarkdown
        components={components}
        // remarkPlugins are used to extend or modify the Markdown parsing behavior.
        // Here, remarkGfm enables GitHub Flavored Markdown features (like tables, strikethrough, task lists).
        remarkPlugins={remarkPlugins}
        // rehypePlugins are used to transform the resulting HTML AST after Markdown is parsed.
        // rehypeRaw allows raw HTML in the Markdown to be parsed and rendered (be cautious with untrusted content).
        //  rehypePlugins={rehypePlugins}
      >
        {optimizedContent}
      </ReactMarkdown>
    </div>
  );
};

export default AnimatedMarkdown;
