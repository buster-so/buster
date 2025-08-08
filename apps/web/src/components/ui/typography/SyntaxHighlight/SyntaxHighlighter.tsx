'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/classMerge';
import { getFallbackStyle } from './shiki-instance';
import styles from './SyntaxHighlighter.module.css';
import { animations, type MarkdownAnimation } from '../animation-common';
import type { ThemedToken } from 'shiki';
import { useCodeTokens } from './useCodeTokens';

export const SyntaxHighlighter = (
  ({
    children,
    language = 'sql',
    showLineNumbers = false,
    startingLineNumber = 1,
    className = '',
    isDarkMode = false,
    animation = 'none',
    animationDuration = 500
  }: {
    children: string;
    language?: 'sql' | 'yaml';
    showLineNumbers?: boolean;
    startingLineNumber?: number;
    className?: string;
    isDarkMode?: boolean;
    animation?: MarkdownAnimation;
    animationDuration?: number;
  }) => {
    const { tokens, isLoading } = useCodeTokens(children, language, isDarkMode);

    const hasTokens = !!tokens && !isLoading;

    const style = useMemo(() => {
      if (tokens) {
        return {
          background: tokens.bg,
          color: tokens.fg
        };
      }
      return getFallbackStyle(isDarkMode);
    }, [hasTokens, isDarkMode]);

    return (
      <SyntaxWrapper
        showLineNumbers={showLineNumbers}
        startingLineNumber={startingLineNumber}
        className={className}
        style={style}>
        {hasTokens ? (
          tokens.tokens.map((line: ThemedToken[], index: number) => {
            return (
              <Line
                key={index}
                tokens={line}
                lineNumber={index + 1}
                animation={animation !== 'none' ? animations[animation] : undefined}
                animationDuration={animationDuration}
              />
            );
          })
        ) : (
          <SyntaxFallback fallbackColor={style.color}>{children}</SyntaxFallback>
        )}
      </SyntaxWrapper>
    );
  }
);

SyntaxHighlighter.displayName = 'SyntaxHighlighter';

const SyntaxWrapper: React.FC<{
  children: React.ReactNode;
  showLineNumbers: boolean;
  startingLineNumber: number;
  className: string;
  style: React.CSSProperties;
}> = ({ showLineNumbers, startingLineNumber, className, style, children }) => {
  return (
    <div
      className={cn(
        styles.shikiWrapper,
        showLineNumbers && styles.withLineNumbers,
        'overflow-x-auto',
        className
      )}
      style={{
        ...style,
        ...(showLineNumbers && startingLineNumber !== 1
          ? ({
              '--line-number-start': startingLineNumber - 1
            } as React.CSSProperties)
          : undefined)
      }}>
      <pre>
        <code>{children}</code>
      </pre>
    </div>
  );
};

const Line: React.FC<{
  tokens: Pick<ThemedToken, 'content' | 'color'>[];
  lineNumber: number;
  animation?: string;
  animationDuration?: number;
}> = React.memo(({ tokens, animation, lineNumber, animationDuration = 500 }) => {
  const lineStyle =
    animation && animation !== 'none'
      ? { animation: `${animation} ${animationDuration}ms ease-in-out forwards` }
      : undefined;

  return (
    <div className={styles.line} style={lineStyle} data-line-number={lineNumber}>
      {tokens.map((token, index) => (
        <span key={index} style={{ color: token.color }}>
          {token.content}
        </span>
      ))}
    </div>
  );
});

Line.displayName = 'Line';

const SyntaxFallback: React.FC<{ children: string; fallbackColor?: string }> = ({
  children,
  fallbackColor = 'inherit'
}) => {
  const fallbackChildren: Pick<ThemedToken, 'content' | 'color'>[][] = children
    .split('\n')
    .map((line) => {
      return [
        {
          content: line,
          color: fallbackColor
        }
      ];
    });

  return (
    <>
      {fallbackChildren.map((line, index) => (
        <Line
          key={index}
          tokens={line}
          lineNumber={index + 1}
          animation={'none'}
          animationDuration={0}
        />
      ))}
    </>
  );
};
