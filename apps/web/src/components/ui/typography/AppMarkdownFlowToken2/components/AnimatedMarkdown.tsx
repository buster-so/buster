import React from 'react';
import type { AnimatedMarkdownProps } from '../types';
import { useMarkdownParser } from '../hooks/useMarkdownParser';
import { AnimatedText } from './AnimatedText';
import { AnimatedCodeBlock } from './AnimatedCodeBlock';
import { AnimatedImage } from './AnimatedImage';
import { isCodeBlock, extractCodeLanguage, extractCodeContent } from '../utils/markdown';

export const AnimatedMarkdown: React.FC<AnimatedMarkdownProps> = ({
  markdown,
  content,
  isStreaming = false,
  animationSpeed = 50,
  showCursor = true,
  cursorStyle = 'blink',
  animationType = 'typewriter',
  onComplete,
  throttleRate = 500,
  enableThrottling = true,
  renderCodeBlocks = true,
  renderImages = true,
  renderLinks = true,
  codeBlockRenderer,
  className,
}) => {
  const { tokens, isMarkdown, formattedContent } = useMarkdownParser({
    content: markdown || content,
    enableParsing: true,
  });

  // If no markdown detected, render as plain text
  if (!isMarkdown) {
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
  }

  const renderToken = (token: any, index: number) => {
    switch (token.type) {
      case 'heading':
        const HeadingTag = `h${token.level}` as keyof JSX.IntrinsicElements;
        return (
          <HeadingTag key={index} className="font-bold mb-2">
            <AnimatedText
              content={token.content}
              isStreaming={isStreaming}
              throttleRate={throttleRate}
              showCursor={false}
              animationType={animationType}
            />
          </HeadingTag>
        );

      case 'code':
        if (!renderCodeBlocks) {
          return (
            <AnimatedText
              key={index}
              content={token.content}
              isStreaming={isStreaming}
              throttleRate={throttleRate}
              showCursor={false}
              animationType={animationType}
            />
          );
        }

        if (codeBlockRenderer) {
          return React.createElement(codeBlockRenderer, {
            key: index,
            code: token.content,
            language: token.language || 'text',
          });
        }

        return (
          <AnimatedCodeBlock
            key={index}
            code={token.content}
            language={token.language}
            isStreaming={isStreaming}
            throttleRate={throttleRate}
            className="my-2"
          />
        );

      case 'image':
        if (!renderImages) {
          return (
            <span key={index} className="text-blue-500">
              [{token.alt || 'Image'}]
            </span>
          );
        }

        return (
          <AnimatedImage
            key={index}
            src={token.content}
            alt={token.alt || ''}
            isStreaming={isStreaming}
            animationType="fade"
            className="max-w-full h-auto my-2"
          />
        );

      case 'link':
        if (!renderLinks) {
          return (
            <AnimatedText
              key={index}
              content={token.content}
              isStreaming={isStreaming}
              throttleRate={throttleRate}
              showCursor={false}
              animationType={animationType}
            />
          );
        }

        return (
          <a
            key={index}
            href={token.href}
            className="text-blue-500 hover:text-blue-700 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            <AnimatedText
              content={token.content}
              isStreaming={isStreaming}
              throttleRate={throttleRate}
              showCursor={false}
              animationType={animationType}
            />
          </a>
        );

      case 'list':
        return (
          <div key={index} className="flex items-start my-1">
            <span className="mr-2">•</span>
            <AnimatedText
              content={token.content}
              isStreaming={isStreaming}
              throttleRate={throttleRate}
              showCursor={false}
              animationType={animationType}
            />
          </div>
        );

      case 'paragraph':
        if (token.content === '\n') {
          return <br key={index} />;
        }
        return (
          <p key={index} className="mb-2">
            <AnimatedText
              content={token.content}
              isStreaming={isStreaming}
              throttleRate={throttleRate}
              showCursor={false}
              animationType={animationType}
            />
          </p>
        );

      case 'text':
      default:
        return (
          <AnimatedText
            key={index}
            content={token.content}
            isStreaming={isStreaming}
            throttleRate={throttleRate}
            showCursor={index === tokens.length - 1 ? showCursor : false}
            animationType={animationType}
          />
        );
    }
  };

  return (
    <div className={className}>
      {tokens.map((token, index) => renderToken(token, index))}
    </div>
  );
};