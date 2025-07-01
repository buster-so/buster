import { cva } from 'class-variance-authority';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import type { ExtraProps } from 'react-markdown';
import { cn } from '../../../../lib/classMerge';
import { AppCodeBlock } from '../AppCodeBlock/AppCodeBlock';

// Helper function to get the appropriate animation class
const getAnimationClass = (showLoader: boolean, isStreaming: boolean = false): string => {
  if (!showLoader) return '';
  return isStreaming ? 'streaming-content' : 'fade-in duration-700';
};

// Utility to diff content and wrap new words with animations
const useStreamingContent = (
  newContent: string, 
  isStreaming: boolean, 
  showLoader: boolean
): React.ReactNode => {
  const [renderedContent, setRenderedContent] = useState<React.ReactNode>(newContent);
  const previousContentRef = useRef<string>('');
  const animationKeyRef = useRef<number>(0);

  useEffect(() => {
    if (!isStreaming || !showLoader) {
      setRenderedContent(newContent);
      previousContentRef.current = newContent;
      return;
    }

    const prevContent = previousContentRef.current;
    
    // If new content is longer than previous, we have new content to animate
    if (newContent.length > prevContent.length && newContent.startsWith(prevContent)) {
      const newPart = newContent.slice(prevContent.length);
      const existingPart = prevContent;
      
      // Split new content into words for individual animation
      const newWords = newPart.split(/(\s+)/); // Split but keep whitespace
      
      const animatedNewContent = newWords.map((word, index) => {
        if (word.trim() === '') return word; // Return whitespace as-is
        
        animationKeyRef.current += 1;
        return (
          <span 
            key={`stream-${animationKeyRef.current}`}
            className="streaming-content"
          >
            {word}
          </span>
        );
      });

      setRenderedContent(
        <>
          {existingPart}
          {animatedNewContent}
        </>
      );
    } else {
      // If content changed in other ways, just render it normally
      setRenderedContent(newContent);
    }

    previousContentRef.current = newContent;
  }, [newContent, isStreaming, showLoader]);

  return renderedContent;
};

export interface ExtraPropsExtra extends ExtraProps {
  numberOfLineMarkdown: number;
  isStreaming?: boolean;
}

export const CustomCode: React.FC<
  {
    children?: React.ReactNode;
    markdown: string;
    showLoader: boolean;
    className?: string;
    isStreaming?: boolean;
  } & ExtraPropsExtra
> = ({ children, markdown, showLoader, className, isStreaming = false, node, ...rest }) => {
  const matchRegex = /language-(\w+)/.exec(className || '');
  const language = matchRegex ? matchRegex[1] : undefined;

  return (
    <AppCodeBlock wrapperClassName="my-2.5" className="" language={language}>
      {children}
    </AppCodeBlock>
  );
};

export const CustomParagraph: React.FC<
  {
    children?: React.ReactNode;
    markdown: string;
    showLoader: boolean;
    isStreaming?: boolean;
  } & ExtraPropsExtra
> = ({ children, markdown, showLoader, isStreaming = false, ...rest }) => {
  // Convert children to string for diffing
  const textContent = typeof children === 'string' ? children : 
    Array.isArray(children) ? children.join('') : 
    children?.toString() || '';

  const streamedContent = useStreamingContent(textContent, isStreaming, showLoader);

  // For non-text children (like other React elements), pass through normally
  if (typeof children === 'object' && !Array.isArray(children) && children !== null) {
    return <>{children}</>;
  }

  const getBaseAnimationClass = () => {
    if (!showLoader) return '';
    // Only apply base animation if not streaming (to avoid double animation)
    return !isStreaming ? 'fade-in duration-700' : '';
  };

  return (
    <p className={cn('text-size-inherit! transform-none!', getBaseAnimationClass())}>
      {isStreaming && showLoader ? streamedContent : children}
    </p>
  );
};

const headingVariants = cva('', {
  variants: {
    level: {
      1: 'text-3xl ',
      2: 'text-2xl',
      3: 'text-xl',
      4: 'text-lg',
      5: 'text-md',
      6: 'text-sm',
      base: 'font-bold'
    }
  }
});

export const CustomHeading: React.FC<
  {
    level: 1 | 2 | 3 | 4 | 5 | 6;
    children?: React.ReactNode;
    markdown: string;
    showLoader: boolean;
    numberOfLineMarkdown: number;
    stripFormatting?: boolean;
    isStreaming?: boolean;
  } & ExtraPropsExtra
> = ({ level, children, markdown, stripFormatting = false, showLoader, isStreaming = false, ...rest }) => {
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
  
  // Convert children to string for diffing
  const textContent = typeof children === 'string' ? children : 
    Array.isArray(children) ? children.join('') : 
    children?.toString() || '';

  const streamedContent = useStreamingContent(textContent, isStreaming, showLoader);

  const getBaseAnimationClass = () => {
    if (!showLoader) return '';
    return !isStreaming ? 'fade-in duration-700' : '';
  };
  
  return (
    <HeadingTag
      className={cn(
        headingVariants({ level: stripFormatting ? 'base' : level }),
        'transform-none!',
        getBaseAnimationClass()
      )}>
      {isStreaming && showLoader ? streamedContent : children}
    </HeadingTag>
  );
};

export const CustomOrderedList: React.FC<
  {
    children?: React.ReactNode;
    markdown: string;
    showLoader: boolean;
    start?: string;
    isStreaming?: boolean;
  } & ExtraPropsExtra
> = ({ children, start, markdown, showLoader, isStreaming = false }) => {
  return (
    <ol
      // @ts-expect-error - start is not a valid prop for ol
      start={start}
      className={cn('mt-1 transform-none! space-y-1')}>
      {children}
    </ol>
  );
};

export const CustomUnorderedList: React.FC<
  {
    children?: React.ReactNode;
    markdown: string;
    showLoader: boolean;
    start?: string;
    isStreaming?: boolean;
  } & ExtraPropsExtra
> = ({ start, children, showLoader, isStreaming = false }) => {
  return (
    <ul
      className={cn('mt-1 transform-none! space-y-1')}
      // @ts-expect-error - start is not a valid prop for ul
      start={start}>
      {children}
    </ul>
  );
};

export const CustomListItem: React.FC<
  {
    children?: React.ReactNode;
    markdown: string;
    showLoader: boolean;
    isStreaming?: boolean;
  } & ExtraPropsExtra
> = ({ children, showLoader, isStreaming = false }) => {
  // Convert children to string for diffing if it's simple text
  const textContent = typeof children === 'string' ? children : 
    (Array.isArray(children) && children.every(child => typeof child === 'string')) ? 
    children.join('') : null;

  const streamedContent = textContent ? 
    useStreamingContent(textContent, isStreaming, showLoader) : null;

  const getBaseAnimationClass = () => {
    if (!showLoader) return '';
    return !isStreaming ? 'fade-in duration-700' : '';
  };

  return (
    <li className={cn('transform-none! space-y-1', getBaseAnimationClass())}>
      {isStreaming && showLoader && streamedContent ? streamedContent : children}
    </li>
  );
};

export const CustomBlockquote: React.FC<
  {
    children?: React.ReactNode;
    markdown: string;
    showLoader: boolean;
    isStreaming?: boolean;
  } & ExtraPropsExtra
> = ({ children, markdown, showLoader, isStreaming = false, ...rest }) => {
  return (
    <blockquote className={cn('transform-none!', getAnimationClass(showLoader, isStreaming))}>
      {children}
    </blockquote>
  );
};

export const CustomTable: React.FC<
  {
    children?: React.ReactNode;
    markdown: string;
    showLoader: boolean;
    isStreaming?: boolean;
  } & ExtraPropsExtra
> = ({ children, markdown, showLoader, isStreaming = false, ...rest }) => {
  return (
    <table className={cn('transform-none!', getAnimationClass(showLoader, isStreaming))}>
      {children}
    </table>
  );
};

export const CustomSpan: React.FC<
  {
    children?: React.ReactNode;
    markdown: string;
    showLoader: boolean;
    isStreaming?: boolean;
  } & ExtraPropsExtra
> = ({ children, markdown, showLoader, isStreaming = false, ...rest }) => {
  const textContent = typeof children === 'string' ? children : 
    Array.isArray(children) ? children.join('') : 
    children?.toString() || '';

  const streamedContent = useStreamingContent(textContent, isStreaming, showLoader);

  const getBaseAnimationClass = () => {
    if (!showLoader) return '';
    return !isStreaming ? 'fade-in duration-700' : '';
  };

  return (
    <span className={cn('transform-none!', getBaseAnimationClass())}>
      {isStreaming && showLoader ? streamedContent : children}
    </span>
  );
};

export const CustomStrong: React.FC<
  {
    children?: React.ReactNode;
    markdown: string;
    showLoader: boolean;
    isStreaming?: boolean;
  } & ExtraPropsExtra
> = ({ children, markdown, showLoader, isStreaming = false, ...rest }) => {
  const textContent = typeof children === 'string' ? children : 
    Array.isArray(children) ? children.join('') : 
    children?.toString() || '';

  const streamedContent = useStreamingContent(textContent, isStreaming, showLoader);

  const getBaseAnimationClass = () => {
    if (!showLoader) return '';
    return !isStreaming ? 'fade-in duration-700' : '';
  };

  return (
    <strong className={cn('transform-none!', getBaseAnimationClass())}>
      {isStreaming && showLoader ? streamedContent : children}
    </strong>
  );
};

export const CustomEm: React.FC<
  {
    children?: React.ReactNode;
    markdown: string;
    showLoader: boolean;
    isStreaming?: boolean;
  } & ExtraPropsExtra
> = ({ children, markdown, showLoader, isStreaming = false, ...rest }) => {
  const textContent = typeof children === 'string' ? children : 
    Array.isArray(children) ? children.join('') : 
    children?.toString() || '';

  const streamedContent = useStreamingContent(textContent, isStreaming, showLoader);

  const getBaseAnimationClass = () => {
    if (!showLoader) return '';
    return !isStreaming ? 'fade-in duration-700' : '';
  };

  return (
    <em className={cn('transform-none!', getBaseAnimationClass())}>
      {isStreaming && showLoader ? streamedContent : children}
    </em>
  );
};

export const CustomItalic: React.FC<
  {
    children?: React.ReactNode;
    markdown: string;
    showLoader: boolean;
    isStreaming?: boolean;
  } & ExtraPropsExtra
> = ({ children, markdown, showLoader, isStreaming = false, ...rest }) => {
  const textContent = typeof children === 'string' ? children : 
    Array.isArray(children) ? children.join('') : 
    children?.toString() || '';

  const streamedContent = useStreamingContent(textContent, isStreaming, showLoader);

  const getBaseAnimationClass = () => {
    if (!showLoader) return '';
    return !isStreaming ? 'fade-in duration-700' : '';
  };

  return (
    <i className={cn('transform-none!', getBaseAnimationClass())}>
      {isStreaming && showLoader ? streamedContent : children}
    </i>
  );
};

export const CustomUnderline: React.FC<
  {
    children?: React.ReactNode;
    markdown: string;
    showLoader: boolean;
    isStreaming?: boolean;
  } & ExtraPropsExtra
> = ({ children, markdown, showLoader, isStreaming = false, ...rest }) => {
  const textContent = typeof children === 'string' ? children : 
    Array.isArray(children) ? children.join('') : 
    children?.toString() || '';

  const streamedContent = useStreamingContent(textContent, isStreaming, showLoader);

  const getBaseAnimationClass = () => {
    if (!showLoader) return '';
    return !isStreaming ? 'fade-in duration-700' : '';
  };

  return (
    <u className={cn('transform-none!', getBaseAnimationClass())}>
      {isStreaming && showLoader ? streamedContent : children}
    </u>
  );
};

export const CustomStrikethrough: React.FC<
  {
    children?: React.ReactNode;
    markdown: string;
    showLoader: boolean;
    isStreaming?: boolean;
  } & ExtraPropsExtra
> = ({ children, markdown, showLoader, isStreaming = false, ...rest }) => {
  const textContent = typeof children === 'string' ? children : 
    Array.isArray(children) ? children.join('') : 
    children?.toString() || '';

  const streamedContent = useStreamingContent(textContent, isStreaming, showLoader);

  const getBaseAnimationClass = () => {
    if (!showLoader) return '';
    return !isStreaming ? 'fade-in duration-700' : '';
  };

  return (
    <s className={cn('transform-none!', getBaseAnimationClass())}>
      {isStreaming && showLoader ? streamedContent : children}
    </s>
  );
};

export const CustomLink: React.FC<
  {
    children?: React.ReactNode;
    markdown: string;
    showLoader: boolean;
    isStreaming?: boolean;
  } & ExtraPropsExtra
> = ({ children, markdown, showLoader, isStreaming = false, ...rest }) => {
  const textContent = typeof children === 'string' ? children : 
    Array.isArray(children) ? children.join('') : 
    children?.toString() || '';

  const streamedContent = useStreamingContent(textContent, isStreaming, showLoader);

  const getBaseAnimationClass = () => {
    if (!showLoader) return '';
    return !isStreaming ? 'fade-in duration-700' : '';
  };

  return (
    <a className={cn('transform-none!', getBaseAnimationClass())}>
      {isStreaming && showLoader ? streamedContent : children}
    </a>
  );
};
