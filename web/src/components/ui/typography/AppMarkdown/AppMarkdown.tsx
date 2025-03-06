import React, { memo, useMemo } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw'; // For rendering HTML
import {
  CustomCode,
  CustomHeading,
  CustomListItem,
  CustomParagraph,
  CustomBlockquote,
  CustomSpan
} from './AppMarkdownCommon';
import { useMemoizedFn } from 'ahooks';
import { cn } from '@/lib/classMerge';
import styles from './AppMarkdown.module.css';

const AppMarkdownBase: React.FC<{
  markdown: string | null;
  showLoader?: boolean;
  className?: string;
}> = ({ markdown = '', showLoader = false, className = '' }) => {
  const currentMarkdown = markdown || '';
  const commonProps = useMemo(() => {
    const numberOfLineMarkdown = currentMarkdown.split('\n').length;
    return {
      markdown: currentMarkdown,
      showLoader,
      numberOfLineMarkdown
    };
  }, [currentMarkdown, showLoader]);

  const text = useMemoizedFn((props: React.SVGTextElementAttributes<SVGTextElement>) => (
    <CustomParagraph {...props} {...commonProps} />
  ));
  const code = useMemoizedFn((props) => <CustomCode {...props} {...commonProps} />);
  const heading = useMemoizedFn((props) => <CustomHeading {...props} {...commonProps} />);
  const listItem = useMemoizedFn((props) => <CustomListItem {...props} {...commonProps} />);
  const blockquote = useMemoizedFn((props) => <CustomBlockquote {...props} {...commonProps} />);
  const span = useMemoizedFn((props) => <CustomSpan {...props} {...commonProps} />);
  const li = useMemoizedFn((props) => <CustomListItem {...props} {...commonProps} />);
  const p = useMemoizedFn((props) => <CustomParagraph {...props} {...commonProps} />);
  const h1 = useMemoizedFn((props) => <CustomHeading as="h1" {...props} {...commonProps} />);
  const h2 = useMemoizedFn((props) => <CustomHeading as="h2" {...props} {...commonProps} />);
  const h3 = useMemoizedFn((props) => <CustomHeading as="h3" {...props} {...commonProps} />);
  const h4 = useMemoizedFn((props) => <CustomHeading as="h4" {...props} {...commonProps} />);
  const h5 = useMemoizedFn((props) => <CustomHeading level={5} {...props} {...commonProps} />);
  const h6 = useMemoizedFn((props) => <CustomHeading level={6} {...props} {...commonProps} />);

  const memoizedComponents: Partial<Components> = useMemo(() => {
    return {
      //common components,
      text,
      code,
      heading,
      listItem,
      blockquote,
      span,
      p,
      h1,
      h2,
      h3,
      h4,
      h5,
      h6,
      li
    };
  }, []);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      skipHtml={true}
      components={memoizedComponents}
      rehypePlugins={[rehypeRaw]} //rehypeSanitize we will assume that the markdown is safe? If we use it we cant do web components
      className={cn(styles.container, 'space-y-2.5', className)}>
      {currentMarkdown}
    </ReactMarkdown>
  );
};

export const AppMarkdown = memo(AppMarkdownBase);

export default AppMarkdown;
