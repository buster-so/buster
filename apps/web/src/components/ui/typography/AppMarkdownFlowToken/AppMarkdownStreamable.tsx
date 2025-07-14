import React from 'react';
import { memo, useMemo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { motion, type Variants } from 'framer-motion';
import { cn } from '@/lib/classMerge';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { useStreamable } from './useStreamable';
import type { AppMarkdownStreamableProps, AnimationConfig } from './types';

// Animation variants for different animation types
const animationVariants: Record<string, Variants> = {
  'fade-in': {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  }
};

// Component for animated markdown elements
const AnimatedElement: React.FC<{
  children: React.ReactNode;
  isVisible: boolean;
  animation: AnimationConfig;
  className?: string;
}> = ({ children, isVisible, animation, className }) => {
  const variants = animationVariants[animation.animation];
  
  return (
    <motion.span
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      variants={variants}
      transition={{
        duration: animation.duration / 1000,
        ease: animation.timingFunction as any
      }}
      className={className}
    >
      {children}
    </motion.span>
  );
};

// Custom components for ReactMarkdown
const createAnimatedComponents = (
  visibleContent: string,
  animation: AnimationConfig
): Partial<Components> => {
  const animatedWrapper = (Component: React.ComponentType<any>) => {
    return (props: any) => {
      const isVisible = visibleContent.includes(props.children || '');
      return (
        <AnimatedElement isVisible={isVisible} animation={animation}>
          <Component {...props} />
        </AnimatedElement>
      );
    };
  };

  return {
    p: animatedWrapper(({ children, ...props }) => (
      <p className="mb-4 leading-relaxed" {...props}>
        {children}
      </p>
    )),
    h1: animatedWrapper(({ children, ...props }) => (
      <h1 className="text-3xl font-bold mb-4 mt-6" {...props}>
        {children}
      </h1>
    )),
    h2: animatedWrapper(({ children, ...props }) => (
      <h2 className="text-2xl font-semibold mb-3 mt-5" {...props}>
        {children}
      </h2>
    )),
    h3: animatedWrapper(({ children, ...props }) => (
      <h3 className="text-xl font-medium mb-2 mt-4" {...props}>
        {children}
      </h3>
    )),
    h4: animatedWrapper(({ children, ...props }) => (
      <h4 className="text-lg font-medium mb-2 mt-3" {...props}>
        {children}
      </h4>
    )),
    h5: animatedWrapper(({ children, ...props }) => (
      <h5 className="text-base font-medium mb-1 mt-2" {...props}>
        {children}
      </h5>
    )),
    h6: animatedWrapper(({ children, ...props }) => (
      <h6 className="text-sm font-medium mb-1 mt-2" {...props}>
        {children}
      </h6>
    )),
    strong: animatedWrapper(({ children, ...props }) => (
      <strong className="font-semibold" {...props}>
        {children}
      </strong>
    )),
    em: animatedWrapper(({ children, ...props }) => (
      <em className="italic" {...props}>
        {children}
      </em>
    )),
    code: animatedWrapper(({ children, inline, ...props }) => {
      if (inline) {
        return (
          <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props}>
            {children}
          </code>
        );
      }
      return (
        <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto mb-4">
          <code className="text-sm font-mono" {...props}>
            {children}
          </code>
        </pre>
      );
    }),
    blockquote: animatedWrapper(({ children, ...props }) => (
      <blockquote className="border-l-4 border-gray-300 pl-4 my-4 italic text-gray-700" {...props}>
        {children}
      </blockquote>
    )),
    ul: animatedWrapper(({ children, ...props }) => (
      <ul className="list-disc pl-6 mb-4 space-y-1" {...props}>
        {children}
      </ul>
    )),
    ol: animatedWrapper(({ children, ...props }) => (
      <ol className="list-decimal pl-6 mb-4 space-y-1" {...props}>
        {children}
      </ol>
    )),
    li: animatedWrapper(({ children, ...props }) => (
      <li className="leading-relaxed" {...props}>
        {children}
      </li>
    )),
    a: animatedWrapper(({ children, href, ...props }) => (
      <a 
        href={href} 
        className="text-blue-600 hover:text-blue-800 underline" 
        target="_blank" 
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    )),
    del: animatedWrapper(({ children, ...props }) => (
      <del className="line-through text-gray-500" {...props}>
        {children}
      </del>
    ))
  };
};

const AppMarkdownStreamableBase: React.FC<AppMarkdownStreamableProps> = ({
  content,
  animation = 'fade-in',
  animationDuration = 300,
  animationTimingFunction = 'ease-out',
  streaming,
  separator = 'character',
  charactersPerSecond = 100,
  style,
  className
}) => {
  const { blocks, isComplete } = useStreamable({
    content,
    streaming,
    separator: separator as 'word' | 'character' | 'diff',
    charactersPerSecond
  });

  const animationConfig: AnimationConfig = useMemo(() => ({
    animation: animation as 'fade-in',
    duration: animationDuration,
    timingFunction: animationTimingFunction
  }), [animation, animationDuration, animationTimingFunction]);

  // Calculate visible content based on streaming state
  const visibleContent = useMemo(() => {
    if (!streaming || isComplete) {
      return content;
    }
    
    return blocks
      .filter(block => block.isVisible)
      .map(block => block.content)
      .join('');
  }, [blocks, streaming, isComplete, content]);

  const memoizedComponents = useMemo(() => {
    return createAnimatedComponents(visibleContent, animationConfig);
  }, [visibleContent, animationConfig]);

  const remarkPlugins = useMemo(() => [remarkGfm], []);
  const rehypePlugins = useMemo(() => [rehypeRaw], []);

  return (
    <div 
      className={cn(
        'prose prose-sm max-w-none',
        'prose-headings:font-semibold prose-headings:text-gray-900',
        'prose-p:text-gray-800 prose-p:leading-relaxed',
        'prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline',
        'prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded',
        'prose-pre:bg-gray-100 prose-pre:border',
        'prose-blockquote:border-l-gray-300 prose-blockquote:text-gray-700',
        'prose-ul:list-disc prose-ol:list-decimal',
        'prose-li:marker:text-gray-500',
        className
      )}
      style={style}
    >
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={memoizedComponents}
        skipHtml={false}
      >
        {visibleContent}
      </ReactMarkdown>
    </div>
  );
};

export const AppMarkdownStreamable = memo(AppMarkdownStreamableBase);
export default AppMarkdownStreamable;