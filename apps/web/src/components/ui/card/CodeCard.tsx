import React from 'react';
import { DynamicAppCodeEditor as AppCodeEditor } from '@/components/ui/inputs/AppCodeEditor/DynamicAppCodeEditor';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks';
import { Button } from '../buttons/Button';
import { ErrorClosableContainer } from '../error/ErrorClosableContainer';
import { Copy, Download } from '../icons';
import { FileCard } from './FileCard';

export const CodeCard: React.FC<{
  code: string;
  language: string;
  fileName: string;
  className?: string;
  error?: string;
  buttons?: React.ReactNode | true;
  onChange?: (code: string) => void;
  readOnly?: boolean;
  onMetaEnter?: () => void;
}> = React.memo(
  ({
    code,
    onMetaEnter,
    language = 'yml',
    fileName,
    className = 'h-full overflow-hidden',
    buttons = true,
    onChange,
    readOnly = false,
    error = ''
  }) => {
    const ShownButtons = React.useMemo(
      () =>
        buttons === true ? (
          <CardButtons fileName={fileName} code={code} language={language} />
        ) : (
          buttons
        ),
      [buttons, fileName, code, language]
    );

    return (
      <FileCard fileName={fileName} headerButtons={ShownButtons} className={className}>
        <AppCodeEditor
          language={language}
          value={code}
          onChange={onChange}
          readOnly={readOnly}
          height="100%"
          onMetaEnter={onMetaEnter}
          className="border-none"
        />
        {error && <ErrorClosableContainer error={error} className="bottom-10!" />}
      </FileCard>
    );
  }
);
CodeCard.displayName = 'CodeCard';

const CardButtons: React.FC<{
  fileName: string;
  code: string;
  language: string;
}> = React.memo(({ fileName, code, language }) => {
  const { openInfoMessage, openErrorMessage } = useBusterNotifications();

  const handleCopyCode = useMemoizedFn(async () => {
    try {
      await navigator.clipboard.writeText(code);
      openInfoMessage('Code copied to clipboard');
    } catch (error) {
      openErrorMessage('Failed to copy code');
    }
  });

  const handleDownload = useMemoizedFn(() => {
    try {
      const blob = new Blob([code], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.${language}`; //this is actually not a good idea...
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      openErrorMessage('Failed to download file');
    }
  });

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" prefix={<Copy />} onClick={handleCopyCode} title="Copy code" />
      <Button
        variant="ghost"
        prefix={<Download />}
        onClick={handleDownload}
        title="Download file"
      />
    </div>
  );
});
CardButtons.displayName = 'CardButtons';
