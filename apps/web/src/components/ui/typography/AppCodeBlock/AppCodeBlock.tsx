'use client';

import React from 'react';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { Button } from '../../buttons/Button';
import { FileCard } from '../../card/FileCard';
import { Copy } from '../../icons/NucleoIconOutlined';
import { SyntaxHighlighter } from '../SyntaxHighlight';

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
    style
  } = props;

  const code = String(children).replace(/\n$/, '');
  const { openSuccessMessage } = useBusterNotifications();

  const copyCode = useMemoizedFn(() => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    openSuccessMessage('Copied to clipboard');
  });

  const headerButtons = React.useMemo(() => {
    return (
      showCopyButton && (
        <Button variant="ghost" onClick={copyCode} prefix={<Copy />}>
          Copy
        </Button>
      )
    );
  }, [showCopyButton, copyCode]);

  //this is a huge assumption, but if there is no language, it is probably an inline code block
  if (!language) {
    return <CodeInlineWrapper>{children}</CodeInlineWrapper>;
  }

  return (
    <FileCard
      fileName={title || language}
      className={wrapperClassName}
      headerButtons={headerButtons}>
      <div className="w-full overflow-x-auto">
        <div className="code-wrapper">
          <SyntaxHighlighter
            className={`${className} m-0! border-none! p-3! opacity-100 transition`}
            language={language}
            customStyle={style}>
            {code}
          </SyntaxHighlighter>
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
