import type React from 'react';
import { memo, useMemo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { cn } from '../../../../lib/classMerge';
import styles from './AppMarkdown.module.css';
//import rehypeRaw from 'rehype-raw'; // For rendering HTML
import {
  CustomBlockquote,
  CustomCode,
  CustomEm,
  CustomHeading,
  CustomListItem,
  CustomOrderedList,
  CustomParagraph,
  CustomSpan,
  CustomStrong,
  CustomUnorderedList,
  CustomUnderline,
  CustomStrikethrough,
  CustomLink
} from './AppMarkdownCommon';

// remarkGfm plugin adds GitHub Flavored Markdown support
// including tables, strikethrough, tasklists, and literal URLs
const remarkPlugins = [remarkGfm];

const AppMarkdownBase: React.FC<{
  markdown: string | null;
  showLoader?: boolean;
  className?: string;
  stripFormatting?: boolean;
}> = ({ markdown = '', showLoader = false, className = '', stripFormatting = false }) => {
  const currentMarkdown = markdown || '';

  const commonProps = useMemo(() => {
    const numberOfLineMarkdown = currentMarkdown.split('\n').length;
    return {
      markdown: currentMarkdown,
      showLoader,
      numberOfLineMarkdown,
      stripFormatting
    };
  }, [currentMarkdown, showLoader, stripFormatting]);

  const text = useMemoizedFn((props: React.SVGTextElementAttributes<SVGTextElement>) => (
    <CustomParagraph {...props} {...commonProps} />
  ));
  const code = useMemoizedFn((props) => <CustomCode {...props} {...commonProps} />);
  const heading = useMemoizedFn((props) => <CustomHeading {...props} {...commonProps} />);
  const listItem = useMemoizedFn((props) => <CustomListItem {...props} {...commonProps} />);
  const blockquote = useMemoizedFn((props) => <CustomBlockquote {...props} {...commonProps} />);
  const span = useMemoizedFn((props) => <CustomSpan {...props} {...commonProps} />);
  const ol = useMemoizedFn((props) => <CustomOrderedList {...props} {...commonProps} />);
  const ul = useMemoizedFn((props) => <CustomUnorderedList {...props} {...commonProps} />);
  const li = useMemoizedFn((props) => <CustomListItem {...props} {...commonProps} />);
  const p = useMemoizedFn((props) => <CustomParagraph {...props} {...commonProps} />);
  const h1 = useMemoizedFn((props) => <CustomHeading level={1} {...props} {...commonProps} />);
  const h2 = useMemoizedFn((props) => <CustomHeading level={2} {...props} {...commonProps} />);
  const h3 = useMemoizedFn((props) => <CustomHeading level={3} {...props} {...commonProps} />);
  const h4 = useMemoizedFn((props) => <CustomHeading level={4} {...props} {...commonProps} />);
  const h5 = useMemoizedFn((props) => <CustomHeading level={5} {...props} {...commonProps} />);
  const h6 = useMemoizedFn((props) => <CustomHeading level={6} {...props} {...commonProps} />);
  const strong = useMemoizedFn((props) => <CustomStrong {...props} {...commonProps} />);
  const em = useMemoizedFn((props) => <CustomEm {...props} {...commonProps} />);
  const u = useMemoizedFn((props) => <CustomUnderline {...props} {...commonProps} />);
  const s = useMemoizedFn((props) => <CustomStrikethrough {...props} {...commonProps} />);
  const a = useMemoizedFn((props) => <CustomLink {...props} {...commonProps} />);

  const memoizedComponents: Partial<Components> = useMemo(() => {
    // return undefined;
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
      li,
      ol,
      ul,
      strong,
      em,
      u,
      s,
      a
    };
  }, []);

  return (
    <div className={cn(styles.container, 'flex flex-col space-y-2 leading-1.5', className)}>
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        skipHtml={true}
        components={memoizedComponents}
        //   rehypePlugins={rehypePlugins}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
};

export const AppMarkdown = memo(AppMarkdownBase);

export default AppMarkdown;
