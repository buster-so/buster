import { cva } from 'class-variance-authority';
import type React from 'react';
import type { ExtraProps } from 'react-markdown';
import { cn } from '../../../../lib/classMerge';
import { AppCodeBlock } from '../AppCodeBlock/AppCodeBlock';

// Helper function to get the appropriate animation class
const getAnimationClass = (showLoader: boolean, isStreaming: boolean = false): string => {
  if (!showLoader) return '';
  return isStreaming ? 'streaming-content' : 'fade-in duration-700';
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

  if (Array.isArray(children)) {
    return (
      <p className={cn('text-size-inherit! transform-none!', getAnimationClass(showLoader, isStreaming))}>
        {children}
      </p>
    );
  }

  //weird bug where all web components are rendered as p
  //web components are objects
  if (typeof children === 'object') {
    return <>{children}</>;
  }

  return (
    <p className={cn('text-size-inherit! transform-none!', getAnimationClass(showLoader, isStreaming))}>
      {children}
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
  
  return (
    <HeadingTag
      className={cn(
        headingVariants({ level: stripFormatting ? 'base' : level }),
        'transform-none!',
        getAnimationClass(showLoader, isStreaming)
      )}>
      {children}
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
  return (
    <li className={cn('transform-none! space-y-1', getAnimationClass(showLoader, isStreaming))}>
      {children}
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
  return (
    <span className={cn('transform-none!', getAnimationClass(showLoader, isStreaming))}>{children}</span>
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
  return (
    <strong className={cn('transform-none!', getAnimationClass(showLoader, isStreaming))}>
      {children}
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
  return (
    <em className={cn('transform-none!', getAnimationClass(showLoader, isStreaming))}>{children}</em>
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
  return <i className={cn('transform-none!', getAnimationClass(showLoader, isStreaming))}>{children}</i>;
};

export const CustomUnderline: React.FC<
  {
    children?: React.ReactNode;
    markdown: string;
    showLoader: boolean;
    isStreaming?: boolean;
  } & ExtraPropsExtra
> = ({ children, markdown, showLoader, isStreaming = false, ...rest }) => {
  return <u className={cn('transform-none!', getAnimationClass(showLoader, isStreaming))}>{children}</u>;
};

export const CustomStrikethrough: React.FC<
  {
    children?: React.ReactNode;
    markdown: string;
    showLoader: boolean;
    isStreaming?: boolean;
  } & ExtraPropsExtra
> = ({ children, markdown, showLoader, isStreaming = false, ...rest }) => {
  return <s className={cn('transform-none!', getAnimationClass(showLoader, isStreaming))}>{children}</s>;
};

export const CustomLink: React.FC<
  {
    children?: React.ReactNode;
    markdown: string;
    showLoader: boolean;
    isStreaming?: boolean;
  } & ExtraPropsExtra
> = ({ children, markdown, showLoader, isStreaming = false, ...rest }) => {
  return <a className={cn('transform-none!', getAnimationClass(showLoader, isStreaming))}>{children}</a>;
};
