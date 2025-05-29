'use client';

import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import React from 'react';
import { cn } from '../../../../lib/classMerge';
import { Button } from '../../buttons/Button';
import { FileCard } from '../../card/FileCard';
import { Copy } from '../../icons/NucleoIconOutlined';
import lightTheme from './light';

import dynamic from 'next/dynamic';

const SyntaxHighlighter = dynamic(
  () => import('react-syntax-highlighter').then((mod) => mod.Prism),
  { ssr: false }
);

export const AppCodeBlock: React.FC<{
  language?: string;
  className?: string;
  wrapperClassName?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  showCopyButton?: boolean;
  title?: string;
  buttons?: React.ReactNode;
  showLoader?: boolean;
}> = React.memo(({ title, buttons, showLoader, ...props }) => {
  const {
    children,
    className = '',
    wrapperClassName = '',
    language,
    showCopyButton = true,
    ...rest
  } = props;
  const style = lightTheme;
  const code = String(children).replace(/\n$/, '');
  const { openSuccessMessage } = useBusterNotifications();

  const copyCode = useMemoizedFn(() => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    openSuccessMessage('Copied to clipboard');
  });

  //this is a huge assumption, but if there is no language, it is probably an inline code block
  if (!language) {
    return <CodeInlineWrapper>{children}</CodeInlineWrapper>;
  }

  return (
    <FileCard
      fileName={title || language}
      className={wrapperClassName}
      headerButtons={React.useMemo(() => {
        return (
          showCopyButton && (
            <Button variant="ghost" onClick={copyCode} prefix={<Copy />}>
              Copy
            </Button>
          )
        );
      }, [showCopyButton, copyCode])}>
      <div className="w-full overflow-x-auto">
        <div className="code-wrapper">
          {language ? (
            <SyntaxHighlighter
              {...rest}
              className={`${className} p-3! transition ${!style ? 'opacity-100' : 'm-0! border-none! p-0! opacity-100'}`}
              language={language}
              style={style}>
              {code}
            </SyntaxHighlighter>
          ) : (
            <code {...rest} className={className}>
              {children}
            </code>
          )}
        </div>
      </div>
    </FileCard>
  );
});
AppCodeBlock.displayName = 'AppCodeBlock';

const CodeInlineWrapper: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <code className={'bg-item-active rounded-sm border px-1 text-[0.85em] text-inherit'}>
      {children}
    </code>
  );
};

const PulseLoader = React.memo(({ className, size = 4 }: { className?: string; size?: number }) => {
  return (
    <span
      className={className}
      style={{
        opacity: 0.6,
        display: 'inline-block',
        width: size,
        height: size,
        backgroundColor: 'var(--color-text-default)',
        borderRadius: '100%'
      }}>
      {/* Pulse animation can be added here if needed */}
    </span>
  );
});
PulseLoader.displayName = 'PulseLoader';
